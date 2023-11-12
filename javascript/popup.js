function setPasswordColors(foreground, background) {
    $("#generated, #password, #confirmation").css({
        "background-color": background,
        "color": foreground
    });
}

function getAutoProfileIdForUrl() {
    for (var i = 0; i < Settings.profiles.length; i++) {
        var profile = Settings.profiles[i];
        if (profile.siteList.trim().length !== 0) {
            var sites = profile.siteList.trim().split(/\s+/);
            for (var j = 0; j < sites.length; j++) {
                var regexString = /\s/;
                if ((/^\/.*\/$/).test(sites[j])) {
                    try {
                        regexString = new RegExp(sites[j].replace(/^\/|\/$/g, ""));
                    } catch (e) {}
                }
                var plain2regex = sites[j];
                plain2regex = plain2regex.replace(/[$+()^\[\]\\|{},]/g, "");
                plain2regex = plain2regex.replace(/\?/g, ".");
                plain2regex = plain2regex.replace(/\*/g, ".*");
                var wildcardString = new RegExp(plain2regex, "i");

                if (regexString.test(Settings.currentUrl) || wildcardString.test(Settings.currentUrl)) {
                    return profile.id;
                }
            }
        }
    }
}

function updateFields() {
    var password = $("#password").val();
    var confirmation = $("#confirmation").val();
    var usedUrl = $("#usedtext").val();
    var userName = $("#username").val();
    var profile = Settings.getProfile($("#profile").val());
    var passStrength = 0;

    if (password.length === 0) {
        $("#generated").val("Please Enter Password");
        setPasswordColors("#000000", "#85FFAB");
        hideButtons();
    } else if (!matchesMasterHash(password)) {
        $("#generated").val("Master Password Mismatch");
        setPasswordColors("#FFFFFF", "#FF7272");
        hideButtons();
    } else if (!Settings.useVerificationCode() && !Settings.keepMasterPasswordHash() && password !== confirmation) {
        $("#generated").val("Passwords Don't Match");
        setPasswordColors("#FFFFFF", "#FF7272");
        hideButtons();
    } else {
        var result = profile.getPassword(usedUrl, password, userName);
        $("#generated").val(result);
        setPasswordColors("#008000", "#FFFFFF");
        $("#password, #confirmation").removeAttr("style");
        passStrength = Settings.getPasswordStrength(result).strength;
        showButtons();
    }

    if (Settings.shouldShowStrength()) {
        $("meter").val(passStrength);
        $("#strengthValue").text(passStrength);
    }

    if (Settings.useVerificationCode()) {
        $("#verificationCode").val(getVerificationCode(password));
    }

    Settings.setPassword(password);
}

function delayedUpdate() {
    clearTimeout(window.delayedUpdateID);
    window.delayedUpdateID = setTimeout(updateFields, 800);
}

function matchesMasterHash(password) {
    if (Settings.keepMasterPasswordHash()) {
        var saved = JSON.parse(localStorage.getItem("master_password_hash"));
        var derived = Settings.make_pbkdf2(password, saved.salt, saved.iter);
        return derived.hash === saved.hash;
    } else {
        return true;
    }
}

function updateProfileText() {
    var profile = Settings.getProfile($("#profile").val());
    // Store either matched url or, if set, use profiles own "use text"
    if (profile.getText().length !== 0) {
        $("#usedtext").val(profile.getText());
    } else {
        $("#usedtext").val(profile.getUrl(Settings.currentUrl));
    }
    if (profile.getUsername().length !== 0) {
        $("#username").val(profile.getUsername());
    } else {
        $("#username").val("");
    }
}

function onProfileChanged() {
    updateProfileText();
    updateFields();
}

function hideButtons() {
    if (!$("#copypassword").hasClass("hidden")) {
        $("#copypassword").addClass("hidden");
    }
    if (!$("#injectpassword").hasClass("hidden")) {
        $("#injectpassword").addClass("hidden");
    }
}

function showButtonsScript (){
    var fields = document.getElementsByTagName("input"), fieldCount = 0;
    for (var i = 0; i < fields.length; i++) {
        if (/password/i.test(fields[i].type + ' ' + fields[i].name)) {
            fieldCount += 1;
        }
    }
    return fieldCount;
}

function showButtons() {
    $("#copypassword").removeClass("hidden");
    // Don't run executeScript() on built-in chrome://, opera:// or about:// browser pages since it isn't allowed anyway
    // Also cant run on the Chrome Web Store/Extension Gallery
    if (!(/^about|^chrome|chrome\.google\.com|^opera/i).test(Settings.currentUrl)) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id, allFrames: true},
                func: showButtonsScript,
            }).then(fieldCounts => {
                for (var frame = 0; frame < fieldCounts.length; frame++) {
                    if (fieldCounts[frame].result > 0) {
                        $("#injectpassword").removeClass("hidden");
                    }
                }
            }).catch((err) => {
                console.error("Show button error: " + err.message);
            });
        });
    }
}

function fillFieldsScript(args) {
    // base-64 encode & decode password, string concatenation of a pasword that includes quotes here won't work
    var fields = document.getElementsByTagName("input");
    var nameFilled = false, passFilled = false;
    function isRendered(domObj) {
        var cs = document.defaultView.getComputedStyle(domObj);
        if ((domObj.nodeType !== 1) || (domObj == document.body)) return true;
        if (cs.display !== "none" && cs.visibility !== "hidden") return isRendered(domObj.parentNode);
        return false;
    }
    for (var i = 0; i < fields.length; i++) {
        var elStyle = getComputedStyle(fields[i]);
        var isVisible = isRendered(fields[i]) && (parseFloat(elStyle.width) > 0) && (parseFloat(elStyle.height) > 0);
        var isPasswordField = (/password/i).test(fields[i].type + ' ' + fields[i].name);
        var isUsernameField = (/id|un|name|user|usr|log|email|mail|acct|ssn/i).test(fields[i].name) && (/^(?!display)/i).test(fields[i].name);
        var changeEvent = new Event("change"); // MVC friendly way to force a view-model update
        if (isVisible && !passFilled && fields[i].value.length === 0 && isPasswordField) {
            fields[i].value = args[0];
            passFilled = true;
            fields[i].dispatchEvent(changeEvent);
        }
        if (isVisible && !nameFilled && fields[i].value.length === 0 && isUsernameField) {
            fields[i].value = args[1];
            if (fields[i].value.length === 0) {
                fields[i].focus();
            }
            nameFilled = true;
            fields[i].dispatchEvent(changeEvent);
        }
    }
}

function fillFields(generatedPass) {
    updateFields();
    // Don't run executeScript() on built-in chrome://, opera:// or about:// browser pages since it isn't allowed anyway
    // Also cant run on the Chrome Web Store/Extension Gallery
    if (!(/^about|^chrome|chrome\.google\.com|^opera/i).test(Settings.currentUrl)) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id, allFrames: true},
                args : [ generatedPass ],
                func: fillFieldsScript,
            }).then(() => {
                window.close();
            }).catch((err) => {
                console.error("Fill field error: " + err.message);
            });
        });
    }
}

function copyPassword() {
    updateFields();
    chrome.tabs.query({
        "windowType": "popup"
    }, () => {
        navigator.clipboard.writeText($("#generated").val());
        window.close();
    });
}

function openOptions() {
    chrome.tabs.create({
        "url": chrome.runtime.getURL("html/options.html")
    }, () => {
        window.close();
    });
}

function getVerificationCode(password) {
    var p = Object.create(Profile);
    p.hashAlgorithm = "sha256";
    p.passwordLength = 3;
    p.selectedCharset = CHARSET_OPTIONS[4];
    return p.getPassword("", password, "");
}

function showPasswordField() {
    $("#activatePassword").hide();
    $("#generated").show();
    if (Settings.shouldShowStrength()) {
        $("#strength_row").show();
    }
}

function handleKeyPress(event) {
    // 13 is the key code of the enter key
    if (event.keyCode === 13 && !(/select/i).test(event.target.tagName)) {
        if ((/password/i).test($("#generated").val())) {
            $("#password").focus();
        } else {
            fillFields();
        }
    }

    // ctrl/option + c to copy the password to clipboard and close the popup
    // 67 is the key code of the c character
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 67) {
        copyPassword();
    }
}
function initPopup() {
    chrome.storage.local.get(["password"]).then((result) => {
        if (typeof result.password === "undefined") {
            chrome.storage.local.set({
                password: ""
            });
            updateFields();
            initPopup();
        } else {
            var pass = Settings.getPassword(result.password);

            $("#password").val(pass);
            $("#confirmation").val(pass);

            if (Settings.shouldAlphaSortProfiles()) Settings.alphaSortProfiles();
            for (var i = 0; i < Settings.profiles.length; i++) {
                $("#profile").append(new Option(Settings.profiles[i].title, Settings.profiles[i].id));
            }
            $("#profile").val(getAutoProfileIdForUrl() || Settings.profiles[0].id);

            updateProfileText();
            updateFields();

            if ((/password/i).test($("#generated").val())) {
                $("#password").focus();
            } else {
                $("#password").focus().blur();
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    Settings.loadProfiles();
    Settings.fromChromeStorageLocalToLocalStorage();
    $("#password, #confirmation").on("keyup", Settings.setPassword);
    $("input").on("input", delayedUpdate);
    $("#profile").on("change", onProfileChanged);
    $("#activatePassword").on("click", showPasswordField);
    $("#copypassword").on("click", copyPassword);
    $("#options").on("click", openOptions);

    if (Settings.shouldHidePassword()) {
        $("#generated, #strength_row").hide();
    } else {
        $("#activatePassword").hide();
    }

    if (Settings.keepMasterPasswordHash() || Settings.useVerificationCode()) {
        $("#confirmation_row").hide();
    }

    if (!Settings.useVerificationCode()) {
        $("#verification_row").hide();
    }

    if (!Settings.shouldShowStrength()) {
        $("#strength_row").hide();
    }

    chrome.tabs.query({
        "active": true,
        "currentWindow": true,
        "windowType": "normal"
    }, tabs => {
        Settings.currentUrl = tabs[0].url || "";
        initPopup();
    });

    $("#injectpassword").on("click", function(e) {
        fillFields([$("#generated").val(), $("#username").val()]);
    });

    $(document.body).on("keydown", handleKeyPress);
});
