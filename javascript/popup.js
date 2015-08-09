function setPasswordColors(foreground, background) {
    $("#generated, #password, #confirmation").css({ "background-color": background, "color": foreground });
}

function getAutoProfileIdForUrl() {
    for (var i = 0; i < Settings.profiles.length; i++) {
        var profile = Settings.profiles[i];
        if (profile.siteList.trim().length !== 0) {
            var sites = profile.siteList.trim().split(/\s+/);
            for (var j = 0; j < sites.length; j++) {
                var regexString = /\s/;
                try {
                    regexString = new RegExp(sites[j], "i");
                } catch (e) {}

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
        Settings.setBgPassword("");
    } else if (!matchesMasterHash(password)) {
        $("#generated").val("Master Password Mismatch");
        setPasswordColors("#FFFFFF", "#FF7272");
        hideButtons();
        Settings.setBgPassword("");
    } else if (!Settings.useVerificationCode() && !Settings.keepMasterPasswordHash() && password !== confirmation) {
        $("#generated").val("Passwords Don't Match");
        setPasswordColors("#FFFFFF", "#FF7272");
        hideButtons();
        Settings.setBgPassword("");
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
}

function delayedUpdate() {
    clearTimeout(window.delayedUpdateID);
    window.delayedUpdateID = setTimeout(updateFields, 500);
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

function updateStoreLocation() {
    Settings.setStoreLocation($("#store_location").val());
    Settings.setPassword();
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

function showButtons() {
    $("#copypassword").removeClass("hidden");
    // Don't run executeScript() on built-in chrome:// pages since it isn't allowed anyway
    if (!(/^chrome|^opera/i).test(Settings.currentUrl)) {
        chrome.tabs.executeScript({
            "allFrames": true,
            "code": "var fields = document.getElementsByTagName('input'), fieldCount = 0;" +
                    "for (var i = 0; i < fields.length; i++) {" +
                        "if (/password/i.test(fields[i].type + ' ' + fields[i].name)) {" +
                            "fieldCount += 1;" +
                        "}" +
                    "}"
        }, function(fieldCounts) {
            for (var frame = 0; frame < fieldCounts.length; frame++) {
                if (fieldCounts[frame] > 0) {
                    $("#injectpassword").removeClass("hidden");
                }
            }
        });
    }
}

function fillFields() {
    updateFields();
    if (!(/^chrome|^opera/i).test(Settings.currentUrl)) {
        chrome.tabs.executeScript({
            "allFrames": true,
            // base-64 encode & decode password, string concatenation of a pasword that includes quotes here won't work
            "code": "var fields = document.getElementsByTagName('input');" +
                    "var nameFilled = false, passFilled = false;" +
                    "for (var i = 0; i < fields.length; i++) {" +
                        "var elStyle = getComputedStyle(fields[i]);" +
                        "var isVisible = !(/none/i).test(elStyle.display) && !(/hidden/i).test(elStyle.visibility) && parseFloat(elStyle.width) > 0 && parseFloat(elStyle.height) > 0;" +
                        "var isPasswordField = (/password/i).test(fields[i].type + ' ' + fields[i].name);" +
                        "var isUsernameField = (/id|un|name|user|usr|log|email|mail|acct|ssn/i).test(fields[i].name) && (/^(?!display)/i).test(fields[i].name);" +
                        "if (isVisible && !passFilled && fields[i].value.length === 0 && isPasswordField) {" +
                            "fields[i].value = atob('" + btoa($("#generated").val()) + "');" +
                            "passFilled = true;" +
                        "}" +
                        "if (" + Settings.shouldFillUsername() + ") {" +
                            "if (isVisible && !nameFilled && fields[i].value.length === 0 && isUsernameField && !isPasswordField) {" +
                                "fields[i].value = atob('" + btoa($("#username").val()) + "');" +
                                "nameFilled = true;" +
                            "}" +
                        "}" +
                    "}"
        }, function() {
            window.close();
        });
    }
}

function copyPassword() {
    updateFields();
    chrome.tabs.query({ "windowType": "popup" }, function() {
        $("#activatePassword").hide();
        $("#generated").show().get(0).select();
        document.execCommand("copy");
        window.close();
    });
}

function openOptions() {
    chrome.tabs.create({ "url": chrome.runtime.getURL("html/options.html") }, function() {
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

function init() {
    chrome.runtime.getBackgroundPage(function(bg) {
        var pass = Settings.getPassword(bg.password);

        $("#password").val(pass);
        $("#confirmation").val(pass);
        $("#store_location").val(Settings.storeLocation);

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
    });
}

document.addEventListener("DOMContentLoaded", function() {
    Settings.loadProfiles();
    $("#password, #confirmation").on("keyup", Settings.setPassword);
    $("input").on("keyup", delayedUpdate);
    $("#store_location").on("change", updateStoreLocation);
    $("#profile").on("change", onProfileChanged);
    $("#activatePassword").on("click", showPasswordField);
    $("#copypassword").on("click", copyPassword);
    $("#injectpassword").on("click", fillFields);
    $("#options").on("click", openOptions);

    if (Settings.shouldDisablePasswordSaving() || Settings.hideStoreLocationInPopup()) {
        $("#store_location_row").hide();
    }

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

    if (!Settings.shouldFillUsername()) {
        $("#username_row").hide();
    }

    if (!Settings.shouldShowStrength()) {
        $("#strength_row").hide();
    }

    chrome.tabs.query({ "active": true, "currentWindow": true, "windowType": "normal" }, function(tabs) {
        Settings.currentUrl = tabs[0].url || "";
        init();
    });

    $(document.body).on("keydown", handleKeyPress);
});
