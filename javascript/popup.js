var currentTab = null;

function setPasswordColors(foreground, background) {
    $("#generated").css("background-color", background);
    $("#generated").css("color", foreground);
    $("#password").css("background-color", background);
    $("#password").css("color", foreground);
    $("#confirmation").css("background-color", background);
    $("#confirmation").css("color", foreground);
}

function getAutoProfileIdForUrl(url) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        var profile = profiles[i];
        if (profile.siteList) {
            var usedURL = profile.getUrl(url);
            var sites = profile.siteList.split(' ');
            for (var j = 0; j < sites.length; j++) {
                var pat = sites[j];

                if (pat[0] == '/' && pat[pat.length-1] == '/') {
                    pat = pat.substr(1, pat.length-2);
                } else {
                    pat = pat.replace(/[$+()^\[\]\\|{},]/g, '');
                    pat = pat.replace(/\?/g, '.');
                    pat = pat.replace(/\*/g, '.*');
                }

                if (pat[0] != '^') pat = '^' + pat;
                if (pat[pat.length-1] != '$') pat = pat + '$';

                var re;
                try {
                    re = new RegExp(pat);
                } catch(e) {
                    console.log(e + "\n");
                }

                if (re.test(usedURL) || re.test(url)) {
                    return profile.id;
                }
            }
        }
    }
    return null;
}

function updateFields(e) {
    var password = $("#password").val();
    var confirmation = $("#confirmation").val();
    var usedURL = $("#usedtext").attr('alt');

    var profileId = $("#profile").val();
    if (profileId == "auto") {
        profileId = getAutoProfileIdForUrl(usedURL);
    } else {
        Settings.setActiveProfileId(profileId);
    }
    var profile = Settings.getProfile(profileId);

    Settings.setStoreLocation($("#store_location").val());
    Settings.setPassword(password);

    var enableCopy = false;

    if (password === "") {
        $("#generatedForClipboard").val("");
        $("#generated").val("Enter password");
        setPasswordColors("#000000", "#85FFAB");
    } else if ( !matchesHash(password) ) {
        $("#generatedForClipboard").val("");
        $("#generated").val("Master password mismatch");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else if (!Settings.keepMasterPasswordHash() && password != confirmation) {
        $("#generatedForClipboard").val("");
        $("#generated").val("Password wrong");
        setPasswordColors("#FFFFFF", "#FF7272");
    } else {
        if (profile !== null) {
            var generatedPassword = profile.getPassword($("#usedtext").val(), password);
            $("#generated").val(generatedPassword);
            $("#generatedForClipboard").val(generatedPassword);
            enableCopy = true;
        } else {
            $("#generated").val("");
            $("#generatedForClipboard").val("");
        }
        setPasswordColors("#000000", "#FFFFFF");
    }
    if (enableCopy) {
        showCopy();
    } else {
        hideCopy();
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
  var new_hash = ChromePasswordMaker_SecureHash.make_hash(password);
  return new_hash == saved_hash ;
}

function updateURL(url) {
    var profileId = $("#profile").val();
    if (profileId == "auto") {
        profileId = getAutoProfileIdForUrl(url);
    }
    var profile = Settings.getProfile(profileId);
    // Store url in ALT attribute
    $("#usedtext").attr('alt', url);
    // Store either matched url or, if set, use profiles own "use text"
    $("#usedtext").val(((profile.getText()) ? profile.getText() : profile.getUrl(url)));
}

function onProfileChanged() {
    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.query({active:true, windowId: obj.id}, function(tabs) {
            updateURL(tabs[0].url);
            updateFields();
        });
    });
}

function showInject() {
    $("#injectpasswordrow").fadeIn();
}

function hideCopy() {
  $("#copypassword").hide();
}

function showCopy() {
  $("#copypassword").fadeIn();
}

function init(url) {
    Settings.getPassword(function(password) {
        $("#password").val(password);
        $("#confirmation").val(password);

        if (Settings.shouldDisablePasswordSaving()) {
            $("#store_location_row").hide();
        }

        var activeProfileId = Settings.getActiveProfileId();
        var autoProfileId = getAutoProfileIdForUrl(url);

        var options = "";
        var profiles = Settings.getProfiles();
        for (var i in profiles) {
            var profile = profiles[i];
            if (autoProfileId && profile.id == autoProfileId) {
                options += "<option value='auto' selected='true'";
            } else if (!autoProfileId && profile.id == activeProfileId) {
                options += "<option value='"+profile.id+"' selected='true'";
            } else {
                options += "<option value='"+profile.id+"'";
            }
            options += ">"+profile.title+"</option>";
        }

        $("#profile").empty().append(options);

        updateURL(url);
        $("#store_location").val(Settings.storeLocation);

        updateFields();

        chrome.tabs.sendMessage(currentTab, {hasPasswordField: true}, function(response) {
            if (response.hasField) {
                showInject();
            }
        });

        password = $("#password").val();
        if (password === null || password.length === 0 || (password != $("#confirmation").val())) {
            $("#password").focus();
        } else {
            $("#generated").focus();
        }
    });
}

function fillPassword() {
    chrome.tabs.sendMessage(currentTab, {password: $("#generated").val()});
    window.close();
}

function copyPassword() {
    $("#generatedForClipboard").select();
    document.execCommand("Copy");
    window.close();
}

function openOptions() {
    chrome.tabs.create({url: 'html/options.html'});
    window.close();
}

function showPasswordField() {
    $("#activatePassword").hide();
    $("#generated").show();
    $("#generated").focus();
}

function sendFillPassword() {
    chrome.tabs.sendMessage(currentTab, {hasPasswordField: true}, function(response) {
        if (response.hasField) {
          fillPassword();
        }
    });
}

$(function() {
    $("#password").bind('keyup change', updateFields);
    $("#confirmation").bind('keyup change', updateFields);
    $("#usedtext").bind('keyup change', updateFields);
    $("#store_location").bind('change', updateFields);
    $("#profile").bind('change', onProfileChanged);
    $("#activatePassword").bind('click', showPasswordField);
    $("#copypassword>input").bind('click', copyPassword);
    $("#injectpasswordrow>input").bind('click', fillPassword);
    $("#options>a").bind('click', openOptions);

    $("#injectpasswordrow").hide();
    $("#copypassword").hide();

    if (Settings.shouldHidePassword()){
        $("#generated").hide();
        $("#activatePassword").show();
    } else {
        $("#generated").show();
        $("#activatePassword").hide();
    }

    if (Settings.keepMasterPasswordHash()) {
        var saved_hash = Settings.masterPasswordHash();
        if(saved_hash.charAt(0) != 'n') {
            saved_hash = ChromePasswordMaker_SecureHash.update_old_hash(saved_hash);
            Settings.setMasterPasswordHash(saved_hash);
        }
    }

    $("#generated").keypress(function(event) {
        if (event.keyCode == 13) {
            sendFillPassword();
        }
    });

    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.query({active:true, windowId: obj.id}, function(tabs) {
            currentTab = tabs[0].id;
            init(tabs[0].url);
            $("form").show();
        });
    });

    // Focus hack, see http://stackoverflow.com/a/11400653/1295557
    if (location.search != "?focusHack") location.search = "?focusHack";

    // Tab navigation workaround, see http://code.google.com/p/chromium/issues/detail?id=122352
    // Use Enter instead of Tab
    $("#password").keypress(function(event) {
        if (event.keyCode == 13 && !Settings.keepMasterPasswordHash()) {
            $("#confirmation").focus();
        }
        else if (event.keyCode == 13) {
            sendFillPassword();
        }
    });

    $("#confirmation").keypress(function(event) {
        if (event.keyCode == 13) {
            sendFillPassword();
        }
    });

});
