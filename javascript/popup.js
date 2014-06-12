function setPasswordColors(foreground, background) {
    $("#generated, #password, #confirmation").css({"background-color": background,"color": foreground});
}

function getAutoProfileIdForUrl(url) {
    var profiles = Settings.getProfiles();
    for (var i = 0; i < profiles.length; i++) {
        var profile = profiles[i];
        if (profile.siteList !== "") {
            var usedURL = profile.getUrl(url);
            var sites = profile.siteList.split(" ");
            for (var j = 0; j < sites.length; j++) {
                var pattern = sites[j];
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

                var reg1 = new RegExp(anchoredPattern);
                var reg2 = new RegExp(pattern);

                // Matches url's from siteList when using a "url component" via anchored regex
                if ((reg1.test(usedURL) && usedURL !== "") || reg1.test(url) || 
                // Matches remaining cases with non-anchored regex
                (reg2.test(url) && pattern !== "")) {
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
    $("#copypassword, #injectpasswordrow").css("visibility", "hidden");

    if (password.length === 0) {
        $("#generated").val("Please Enter Password");
        setPasswordColors("#000000", "#85FFAB");
    } else if (!matchesHash(password)) {
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
        $("#verificationCode").val(profile.getVerificationCode(password));
        $("#verification_row").show();
    } else {
        $("#verification_row").hide();
    }
}

function matchesHash(password) {
    if (!Settings.keepMasterPasswordHash()) return true;
    return ChromePasswordMaker_SecureHash.make_hash(password) === Settings.masterPasswordHash();
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
    $("#copypassword").css("visibility", "visible");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {hasPasswordField: true}, function(response) {
            if (response !== undefined && response.hasField) {
                $("#injectpasswordrow").css("visibility", "visible");
            }
        });
    });
}

function init(url) {
    var pass = Settings.getPassword();
    $("#password").val(pass);
    $("#confirmation").val(pass);

    if (Settings.shouldDisablePasswordSaving()) {
        $("#store_location_row").hide();
        Settings.storeLocation = "never";
    }

    var profiles = Settings.getProfiles();
    for (var i = 0; i < profiles.length; i++) {
        $("#profile").append(new Option(profiles[i].title, profiles[i].id));
    }
    $("#profile").val(getAutoProfileIdForUrl(url) || Settings.getProfiles()[0].id);

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
        chrome.tabs.sendMessage(tabs[0].id, {password: $("#generated").val()});
        window.close()
    });
}

function copyPassword() {
    $("#activatePassword").hide();
    $("#generated").show().select();
    document.execCommand("Copy");
    window.close();
}

function openOptions() {
    chrome.tabs.create({url: "html/options.html"});
    window.close();
}

function showPasswordField() {
    $("#activatePassword").hide();
    $("#generated").show().focus();
}

$(function() {
    $("#password, #confirmation, #usedtext").on("keyup", updateFields);
    $("#store_location").on("change", updateFields);
    $("#profile").on("change", onProfileChanged);
    $("#activatePassword").on("click", showPasswordField);
    $("#copypassword").on("click", copyPassword);
    $("#injectpasswordrow").on("click", fillPassword);
    $("#options").on("click", openOptions);

    if (Settings.shouldHidePassword()) {
        $("#generated").hide();
        $("#activatePassword").show();
    } else {
        $("#generated").show();
        $("#activatePassword").hide();
    }

    if (Settings.keepMasterPasswordHash()) {
        var saved_hash = Settings.masterPasswordHash();
        if (saved_hash.charAt(0) !== "n") {
            saved_hash = ChromePasswordMaker_SecureHash.update_old_hash(saved_hash);
            Settings.setMasterPasswordHash(saved_hash);
        }
        $("#confirmation_row").hide();
    } else if (Settings.useVerificationCode()) {
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
