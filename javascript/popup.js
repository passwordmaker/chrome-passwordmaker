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
    var usedURL = $("#usedtext").prop("alt");

    var profileId = $("#profile").val();
    Settings.setActiveProfileId(profileId);
    var profile = Settings.getProfile(profileId);

    Settings.setStoreLocation($("#store_location").val());
    Settings.setPassword(password);
    $("#copypassword, #injectpasswordrow").css("visibility", "hidden");

    if (password === "") {
        $("#generated").val("Please Enter Password");
        setPasswordColors("#000000", "#85FFAB");
    } else if ( !matchesHash(password) ) {
        $("#generated").val("Master Password Mismatch");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else if (!Settings.keepMasterPasswordHash() && password !== confirmation) {
        $("#generated").val("Passwords Don't Match");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else {
        $("#generated").val(profile.getPassword(usedText, password));
        setPasswordColors("#008000", "#FFFFFF");
        showButtons();
    }

    if (Settings.keepMasterPasswordHash()) {
        $("#confirmation_row").hide();
    } else {
        $("#confirmation_row").show();
    }
}

function matchesHash(password) {
    if (!Settings.keepMasterPasswordHash()) return true;
    var saved_hash = Settings.masterPasswordHash();
    var new_hash = ChromePasswordMaker_SecureHash.make_hash(password);
    return new_hash === saved_hash;
}

function updateURL(url) {
    var profileId = $("#profile").val();

    var profile = Settings.getProfile(profileId);
    // Store url in ALT attribute
    $("#usedtext").prop("alt", url);
    // Store either matched url or, if set, use profiles own "use text"
    var text = "";
    if (profile.getText() !== "") {
        text = profile.getText();
    } else {
        text = profile.getUrl(url);
    }
    $("#usedtext").val(text);
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
            if (response && response.hasField) {
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
    }

    Settings.getProfiles().forEach(function(profile) {
        $("#profile").append("<option value='" + profile.id + "'>" + profile.title + "</option>");
    });
    $("#profile").val(getAutoProfileIdForUrl(url) || Settings.getProfiles()[0].id);


    updateURL(url);
    $("#store_location").val(Settings.storeLocation);
    updateFields();

    if (pass === null || pass.length === 0 || (pass !== $("#confirmation").val())) {
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

function sendFillPassword() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {hasPasswordField: true}, function(response) {
            if (response && response.hasField) {
                fillPassword();
            }
        });
    });
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
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        init(tabs[0].url);
    });

    $("#password, #confirmation, #generated").on("keydown", function(event) {
        if (event.keyCode === 13) { // 13 is the character code of the return key
            sendFillPassword();
        }
    });
});
