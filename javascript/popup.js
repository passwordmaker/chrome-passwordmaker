function setPasswordColors(foreground, background) {
    $("#generated, #password, #confirmation").css({"background-color": background,"color": foreground});
}

function getAutoProfileIdForUrl(url) {
    for (var i = 0; i < Settings.profiles.length; i++) {
        var profile = Settings.profiles[i];
        if (profile.siteList.trim().length !== 0) {
            var usedURL = profile.getUrl(url);
            var sites = profile.siteList.trim().split(" ");
            for (var j = 0; j < sites.length; j++) {
                var pattern = sites[j];
                var unmodified = sites[j];

                pattern = pattern.replace(/[$+()^\[\]\\|{},]/g, "");
                pattern = pattern.replace(/\?/g, ".");
                pattern = pattern.replace(/\*/g, ".*");

                var anchoredPattern = pattern;
                if (anchoredPattern[0] !== "^") {
                    anchoredPattern = "^" + anchoredPattern;
                }
                if (pattern[pattern.length - 1] !== "$") {
                    anchoredPattern = anchoredPattern + "$";
                }

                var reg1 = new RegExp(anchoredPattern, "i");
                var reg2 = new RegExp(pattern, "i");

                // Matches url's from siteList when using a "url component" via anchored regex
                if ((reg1.test(usedURL) && usedURL.length !== 0) || reg1.test(url) || 
                // Matches remaining cases with non-anchored regex or plain string match
                (reg2.test(url) && pattern.length !== 0) || url.indexOf(unmodified) >= 0) {
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

    Settings.setStoreLocation($("#store_location").val());
    $("#copypassword, #injectpasswordrow").addClass("hidden");

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
        $("#generated").val(profile.getPassword(usedUrl, password));
        setPasswordColors("#008000", "#FFFFFF");
        Settings.setPassword(password);
        showButtons();
    }

    if (Settings.useVerificationCode()) {
        $("#verificationCode").val(getVerificationCode(password));
        $("#verification_row").show();
    } else {
        $("#verification_row").hide();
    }
}

function delayedUpdate() {
    window.clearTimeout(window.delayedUpdateID);
    window.delayedUpdateID = window.setTimeout(updateFields, 500);
}

function matchesMasterHash(password) {
    if (Settings.keepMasterPasswordHash()) {
        var saved = JSON.parse(Settings.masterPasswordHash());
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

function onProfileChanged() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        updateURL(tabs[0].url);
        updateFields();
    });
}

function showButtons() {
    $("#copypassword").removeClass("hidden");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {hasPasswordField: true}, function(response) {
            if (response !== undefined && response.hasField) {
                $("#injectpasswordrow").removeClass("hidden");
            }
        });
    });
}

function init(url) {
    var pass = Settings.getPassword();
    $("#password").val(pass);
    $("#confirmation").val(pass);

    for (var i = 0; i < Settings.profiles.length; i++) {
        $("#profile").append(new Option(Settings.profiles[i].title, Settings.profiles[i].id));
    }
    $("#profile").val(getAutoProfileIdForUrl(url) || Settings.profiles[0].id);

    updateURL(url);
    $("#store_location").val(Settings.storeLocation);
    updateFields();

    if (pass.length === 0 || pass !== $("#confirmation").val()) {
        $("#password").focus();
    } else {
        $("#generated").focus();
    }
}

function fillPassword() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        updateFields();
        chrome.tabs.sendMessage(tabs[0].id, {password: $("#generated").val()});
        window.close();
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
    chrome.tabs.create({url: "html/options.html"}, function() {
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
    $("#generated").show().focus();
}

$(function() {
    Settings.loadProfiles();
    $("#password, #confirmation, #usedtext").on("keyup", delayedUpdate);
    $("#store_location").on("change", updateFields);
    $("#profile").on("change", onProfileChanged);
    $("#activatePassword").on("click", showPasswordField);
    $("#copypassword").on("click", copyPassword);
    $("#injectpasswordrow").on("click", fillPassword);
    $("#options").on("click", openOptions);

    if (Settings.shouldDisablePasswordSaving()) {
        $("#store_location_row").hide();
        Settings.storeLocation = "never";
    }

    if (Settings.shouldHidePassword()) {
        $("#generated").hide();
        $("#activatePassword").show();
    } else {
        $("#generated").show();
        $("#activatePassword").hide();
    }

    if (Settings.keepMasterPasswordHash() || Settings.useVerificationCode()) {
        $("#confirmation_row").hide();
    } else {
        $("#confirmation_row").show();
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        init(tabs[0].url);
    });

    $("#password, #confirmation, #generated").on("keydown", function(event) {
        if (event.keyCode === 13) { // 13 is the character code of the return key
            fillPassword();
        }
    });
});
