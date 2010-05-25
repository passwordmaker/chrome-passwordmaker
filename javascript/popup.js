var currentTab = null;

function setPasswordColors(foreground, background) {
    $("#generated").css("background-color", background);
    $("#generated").css("color", foreground);        
    $("#password").css("background-color", background);
    $("#password").css("color", foreground);        
    $("#confirmation").css("background-color", background);
    $("#confirmation").css("color", foreground);        
}

function updateFields() {
    var password = $("#password").val();
    var confirmation = $("#confirmation").val();
    var profileId = $("#profile").val();
    var profile = Settings.getProfile(profileId);

    Settings.setStoreLocation($("#store_location").val());
    Settings.setPassword(password);
    Settings.setActiveProfileId(profileId);
    
    if (password == "") {
        $("#generated").val("Enter password");
        setPasswordColors("#000000", "#85FFAB")
    } else if ( ! matchesHash(password) ) {
        $("#generated").val("Master password mismatch");
        setPasswordColors("#FFFFFF", "#FF7272")
    } else if (!Settings.keepMasterPasswordHash() && password != confirmation) {
        $("#generated").val("Password wrong");
        setPasswordColors("#FFFFFF", "#FF7272")
    } else {        
        if (profile != null) {
            $("#generated").val(profile.getPassword($("#usedtext").val(), password));
        } else {
            $("#generated").val("");
        }
        setPasswordColors("#000000", "#FFFFFF")
    }
    if (Settings.keepMasterPasswordHash()) {
      $("#confirmation_row").css('display', 'none');
    } else {
      $("#confirmation_row").css('display', 'block');
    }
}

function matchesHash(password) {
  if (!Settings.keepMasterPasswordHash()) return true;
  var saved_hash = Settings.masterPasswordHash();
  var new_hash = PasswordMaker_SHA256.any_sha256(password, Settings.masterPasswordCharSet);
  return new_hash == saved_hash ;
}

function updateUsedText(url) {
    var profile = Settings.getProfile($("#profile").val());
    $("#usedtext").val(profile.getUrl(url));
}

function fetchUrlAndUpdateUsedText() {
    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.getSelected(obj.id, function(tab) {
            updateUsedText(tab.url);
        });
    });
}

function showInject() {
    $("#injectpasswordrow").fadeIn();
}

function init(url) {
    var profiles = Settings.getProfiles();
    Settings.getPassword(function(password) {
        $("#password").val(password);
        $("#confirmation").val(password);

        var options = "";
        for (var i in profiles) {
            var profile = profiles[i];
            options += "<option value='"+profile.id+"'";
            if (profile.id == Settings.getActiveProfileId()){
                options += " selected='true' ";
            }
            options += "'>"+profile.title+"</option>";
        }

        $("#profile").empty().append(options);

        updateUsedText(url);
        $("#store_location").val(Settings.storeLocation);

        updateFields();

        chrome.tabs.sendRequest(currentTab, {hasPasswordField: true}, function(response) {
            if (response.hasField) {
                showInject();
            }
        });

        password = $("#password").val();
        if (password == null || password.length == 0 || (password != $("#confirmation").val())) {
            $("#password").focus();
        }
    });
}

function fillPassword() {
    chrome.tabs.sendRequest(currentTab, {password: $("#generated").val()});
    window.close();
}

function showPasswordField() {
    $("#activatePassword").hide();
    $("#generated").show();
    $("#generated").focus();     
}

$(function() {
    $("#injectpasswordrow").hide();

    if (Settings.shouldHidePassword()){
        $("#generated").hide();
        $("#activatePassword").show();
    } else {
        $("#generated").show();
        $("#generated").focus(); 
        $("#activatePassword").hide();
    }

    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.getSelected(obj.id, function(tab) {
            currentTab = tab.id;
            init(tab.url);
            $("form").show();
        });
    });
    
    
});
