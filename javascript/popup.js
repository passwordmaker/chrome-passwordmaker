function setPasswordColors(foreground, background) {
    $("#generated, #password, #confirmation").css({"background-color": background,"color": foreground});
}

function getAutoProfileIdForUrl(url) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        var profile = profiles[i];
        if (profile.siteList) {
            var usedURL = profile.getUrl(url);
            var sites = profile.siteList.split(' ');
            for (var j in sites) {
                var pat = sites[j];
                if (pat.indexOf(usedURL) >= 0 || pat.indexOf(url) >= 0) {
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
        $("#generatedForClipboard").val("");
        $("#generated").val("Please Enter Password");
        setPasswordColors("#000000", "#85FFAB");
    } else if ( !matchesHash(password) ) {
        $("#generatedForClipboard").val("");
        $("#generated").val("Master Password Mismatch");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else if (!Settings.keepMasterPasswordHash() && password !== confirmation) {
        $("#generatedForClipboard").val("");
        $("#generated").val("Passwords Don't Match");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else {
        var generatedPassword = profile.getPassword($("#usedtext").val(), password);
        $("#generated, #generatedForClipboard").val(generatedPassword);
        showButtons();
        setPasswordColors("#006400", "#FFFFFF");
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
    $("#usedtext").val(((profile.getText()) ? profile.getText() : profile.getUrl(url)));
}

function onProfileChanged() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        updateURL(tabs[0].url);
        updateFields();
    });
}

function showButtons() {
    $("#copypassword").css("visibility", "visible");
    var tabId = chrome.extension.getBackgroundPage().currentTab;
    chrome.tabs.sendMessage(tabId, {hasPasswordField: true}, function(response) {
        if (response && response.hasField) {
            $("#injectpasswordrow").css("visibility", "visible");
        }
    });
}

function init(url) {
    var pass = Settings.getPassword();
    $("#password").val(pass);
    $("#confirmation").val(pass);

    if (Settings.shouldDisablePasswordSaving()) {
        $("#store_location_row").hide();
    }

    var autoProfileId = getAutoProfileIdForUrl(url);
    var profiles = Settings.getProfiles();

    var profileList = "";
    profiles.forEach(function(profile) {
        if (autoProfileId === profile.id) {
            profileList += "<option value='" + profile.id + "' selected>" + profile.title + "</option>";
        } else {
            profileList += "<option value='" + profile.id + "'>" + profile.title + "</option>";
        }
    });
    $("#profile").html(profileList);

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
    var tabId = chrome.extension.getBackgroundPage().currentTab;
    chrome.tabs.sendMessage(tabId, {password: $("#generated").val()});
    window.close();
}

function copyPassword() {
    document.getElementById("generatedForClipboard").select();
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
    var tabId = chrome.extension.getBackgroundPage().currentTab;
    chrome.tabs.sendMessage(tabId, {hasPasswordField: true}, function(response) {
        if (response && response.hasField) {
            fillPassword();
        }
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
        chrome.extension.getBackgroundPage().currentTab = tabs[0].id;
        init(tabs[0].url);
    });

    $("#password, #confirmation, #generated").on("keydown", function(event) {
        if (event.keyCode === 13) { // 13 is the character code of the return key
            sendFillPassword();
        }
    });
});
