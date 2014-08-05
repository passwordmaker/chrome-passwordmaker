function setPasswordColors(foreground, background) {
    $("#generated, #password, #confirmation").css({"background-color": background, "color": foreground});
}

function getAutoProfileIdForUrl(url) {
    for (var i = 0; i < Settings.profiles.length; i++) {
        var profile = Settings.profiles[i];
        if (profile.siteList.trim().length !== 0) {
            var sites = profile.siteList.trim().split(" ");
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

                if (regexString.test(url) || wildcardString.test(url)) {
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
    var profile = Settings.getProfile($("#profile").val());
    var passStrength = 0;

    $("#copypassword, #injectpassword").addClass("hidden");

    if (password.length === 0) {
        $("#generated").val("Please Enter Password");
        setPasswordColors("#000000", "#85FFAB");
    } else if (!matchesMasterHash(password)) {
        $("#generated").val("Master Password Mismatch");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else if (!Settings.useVerificationCode() && !Settings.keepMasterPasswordHash() && password !== confirmation) {
        $("#generated").val("Passwords Don't Match");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else {
        var result = profile.getPassword(usedUrl, password);
        $("#generated").val(result);
        setPasswordColors("#008000", "#FFFFFF");
        passStrength = Settings.getPasswordStrength(result).strength;
        showButtons();
    }

    if (Settings.shouldShowStrength()) {
        $("meter").val(passStrength);
        $("#strengthValue")[0].textContent = passStrength;
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

function updateURL(url) {
    var profile = Settings.getProfile($("#profile").val());
    // Store either matched url or, if set, use profiles own "use text"
    if (profile.getText().length !== 0) {
        $("#usedtext").val(profile.getText());
    } else {
        $("#usedtext").val(profile.getUrl(url));
    }
}

function updateStoreLocation() {
    Settings.setStoreLocation($("#store_location").val());
    Settings.setPassword();
}

function onProfileChanged() {
    chrome.tabs.query({ "active": true, "currentWindow": true, "windowType": "normal" }, function(tabs) {
        updateURL(tabs[0].url);
        updateFields();
    });
}

function showButtons() {
    $("#copypassword").removeClass("hidden");
    chrome.tabs.query({ "active": true, "currentWindow": true, "windowType": "normal" }, function(tabs) {
        // Don't run executeScript() on built-in chrome:// pages since it isn't allowed anyway
        if (!(/^chrome/i).test(tabs[0].url)) {
            chrome.tabs.executeScript(tabs[0].id, {
                "allFrames": true,
                "code": "document.querySelectorAll('input[type=password]').length"
            }, function(results) {
                for (var frame = 0; frame < results.length; frame++) {
                    if (results[frame] > 0) {
                        $("#injectpassword").removeClass("hidden");
                    }
                }
            });
        }
    });
}

function init(url) {
    chrome.runtime.getBackgroundPage(function(bg) {
        var pass = Settings.getPassword(bg.password);

        $("#password").val(pass);
        $("#confirmation").val(pass);
        $("#store_location").val(Settings.storeLocation);

        for (var i = 0; i < Settings.profiles.length; i++) {
            $("#profile").append(new Option(Settings.profiles[i].title, Settings.profiles[i].id));
        }
        $("#profile").val(getAutoProfileIdForUrl(url) || Settings.profiles[0].id);

        updateURL(url);
        updateFields();

        if (pass.length === 0 || pass !== $("#confirmation").val()) {
            $("#password").focus();
        } else {
            $("#generated").focus();
        }
    });
}

function fillPassword() {
    chrome.tabs.query({ "active": true, "currentWindow": true, "windowType": "normal" }, function(tabs) {
        updateFields();
        chrome.tabs.executeScript(tabs[0].id, {
            "allFrames": true,
            // base-64 encode & decode password, string concatenation of a pasword that includes quotes here won't work
            "code": "var b64pass = '" + btoa($("#generated").val()) + "';" +
                    "var fields = document.querySelectorAll('input[type=password]');" +
                    "for (var i = 0; i < fields.length; i++) {" +
                        // Only fill password input fields that are empty (for change password pages)
                        "if (fields[i].value.length === 0) {" +
                            "fields[i].value = atob(b64pass);" +
                        "}" +
                    "}"
        }, function() {
            window.close();
        });
    });
}

function copyPassword() {
    chrome.tabs.query({windowType: "popup"}, function() {
        updateFields();
        $("#activatePassword").hide();
        $("#generated").show().get(0).select();
        document.execCommand("copy");
        window.close();
    });
}

function openOptions() {
    chrome.tabs.create({url: chrome.runtime.getURL("html/options.html")}, function() {
        window.close();
    });
}

function getVerificationCode(pass) {
    var p = new Profile();
    p.hashAlgorithm = "sha256";
    p.passwordLength = 3;
    p.selectedCharset = CHARSET_OPTIONS[4];
    return p.getPassword("", pass);
}

function showPasswordField() {
    $("#activatePassword").hide();
    if (Settings.shouldShowStrength()) {
        $("#strength_row").show();
    }
    $("#generated").show().focus();
}

document.addEventListener("DOMContentLoaded", function() {
    Settings.loadProfiles();
    $("#password, #confirmation").on("keyup", Settings.setPassword);
    $("#password, #confirmation, #usedtext").on("keyup", delayedUpdate);
    $("#store_location").on("change", updateStoreLocation);
    $("#profile").on("change", onProfileChanged);
    $("#activatePassword").on("click", showPasswordField);
    $("#copypassword").on("click", copyPassword);
    $("#injectpassword").on("click", fillPassword);
    $("#options").on("click", openOptions);

    if (Settings.shouldDisablePasswordSaving()) {
        $("#store_location_row").hide();
        Settings.storeLocation = "never";
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

    if (!Settings.shouldShowStrength()) {
        $("#strength_row").hide();
    }

    chrome.tabs.query({ "active": true, "currentWindow": true, "windowType": "normal" }, function(tabs) {
        init(tabs[0].url || "");
    });

    $("#password, #confirmation, #generated").on("keydown", function(event) {
        if (event.keyCode === 13) { // 13 is the key code of the return key
            fillPassword();
        }
    });
});
