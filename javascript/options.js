var currentProfile = null;

var CHARSET_OPTIONS = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]:\";'<>?,./",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    "0123456789abcdef",
    "0123456789",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "`~!@#$%^&*()_-+={}|[]:\";'<>?,./"
];

function editProfile(id) {
    p = Settings.getProfile(id);
    setCurrentProfile(p);
}

function updateStyle(element, selected, isSelected) {
    if (isSelected) {
        element.addClass(selected);
    } else {
        element.removeClass(selected);
    }
}

function updateExample() {
    updateStyle($("#exprotocol"), "selected", $("#protocolCB").is(":checked"));
    updateStyle($("#exsubdomain"), "selected", $("#subdomainCB").is(":checked"));
    updateStyle($("#exdomain"), "selected", $("#domainCB").is(":checked"));
    updateStyle($("#expath"), "selected", $("#pathCB").is(":checked"));
}

function updateLeet() {
    $("#leetLevelLB").attr("disabled", $("#whereLeetLB").val() == "off");
    updateStyle($("#leetLevelLabel"), "disabled", $("#whereLeetLB").val() == "off");
}

function updateRemoveButton() {
    if (Settings.getProfiles().length <= 1) {
        $("#remove").hide();
    } else {
        $("#remove").show();
    }
}

function addProfile() {
    p = new Profile();
    p.title = "No name";
    Settings.addProfile(p);
    updateProfileList();
    setCurrentProfile(p);
    updateRemoveButton();
}

function removeProfile() {
    if (confirm("Really delete this profile?")) {
        Settings.deleteProfile(currentProfile);
        currentProfile = Settings.getProfiles()[0];
        updateProfileList();
        setCurrentProfile(currentProfile);
        updateRemoveButton();
    }
}

function setCurrentProfile(profile) {
    currentProfile = profile;
    $("#profileNameTB").val(profile.title);
    $("#protocolCB").attr('checked', profile.url_protocol);
    $("#subdomainCB").attr('checked', profile.url_subdomain);
    $("#domainCB").attr('checked', profile.url_domain);
    $("#pathCB").attr('checked', profile.url_path);
    
    $("#whereLeetLB").val(profile.whereToUseL33t);
    $("#leetLevelLB").val(profile.l33tLevel);
    $("#hashAlgorithmLB").val(profile.hashAlgorithm);
    $("#passwdLength").val(profile.passwordLength);
    $("#usernameTB").val(profile.username);
    $("#modifier").val(profile.modifier);
    $("#passwordPrefix").val(profile.passwordPrefix);
    $("#passwordSuffix").val(profile.passwordSuffix);
    
    $("#charset").empty();
    
    for (var i in CHARSET_OPTIONS) {
        $("#charset").append("<option>"+CHARSET_OPTIONS[i]+"</option>");
    }
    $("#charset").append("<option>Custom charset</option>");
    
    $("#charset").change(function() {
        if ($("#charset").val() == "Custom charset"){
            $("#customCharset").val(profile.selectedCharset);
            $("#customCharset").show();
        } else {
            $("#customCharset").hide();
        }
    });

    if ($.inArray(profile.selectedCharset, CHARSET_OPTIONS) != -1) {
        $("#charset").val(profile.selectedCharset);
        $("#customCharset").hide();
    } else {
        $("#charset").val("Custom charset");
        $("#customCharset").val(profile.selectedCharset);
        $("#customCharset").show();
    }
    
    updateExample();
    updateLeet();
    
    highlightProfile();
    
    if (!$("#profile_setting").is(":visible")){
        $("#general_settings").fadeOut(300, function() {
            $("#profile_setting").fadeIn(300);
        });
    }
}

function showOptions() {
    if ($("#profile_setting").is(":visible")){
        $("#profile_setting").fadeOut(300, function () {
            $("#general_settings").fadeIn(300);
        });
    }
}

function highlightProfile(){
    $("#profile_id_" + currentProfile.id).animate({"background-color": "#ffff00"}, 500, 'linear', function() {
        $("#profile_id_" + currentProfile.id).animate({"background-color": "#ffffff"}, 500)
    });
}

function saveProfile() {
    currentProfile.title = $("#profileNameTB").val();
    currentProfile.url_protocol = $("#protocolCB").attr('checked');
    currentProfile.url_subdomain = $("#subdomainCB").attr('checked');
    currentProfile.url_domain = $("#domainCB").attr('checked');
    currentProfile.url_path = $("#pathCB").attr('checked');
    currentProfile.whereToUseL33t = $("#whereLeetLB").val();
    currentProfile.l33tLevel      = $("#leetLevelLB").val();
    currentProfile.hashAlgorithm  = $("#hashAlgorithmLB").val();
    currentProfile.passwordLength = $("#passwdLength").val();
    currentProfile.username       = $("#usernameTB").val();
    currentProfile.modifier       = $("#modifier").val();
    currentProfile.passwordPrefix = $("#passwordPrefix").val();
    currentProfile.passwordSuffix = $("#passwordSuffix").val();
    
    if ($("#charset").val() == "Custom charset"){
        currentProfile.selectedCharset= $("#customCharset").val();
    } else {
        currentProfile.selectedCharset= $("#charset").val();
    }
    
    Settings.saveProfiles();
    updateProfileList();
    highlightProfile();
}

function cloneProfile() {
    var p = jQuery.extend({}, currentProfile);
    p.title = p.title + " Copy";
    Settings.addProfile(p);
    updateProfileList();
    setCurrentProfile(p);
    updateRemoveButton();
}

function updateProfileList() {
    var profiles = Settings.getProfiles();
    var list = "";
    
    for (var i in profiles) {
        var profile = profiles[i];
        list += "<li id='profile_id_"+profile.id+"'><a href='#' onClick='editProfile("+profile.id+")'>"+profile.title+"</a></li>";
    }
    $("#profile_list").empty().append(list);
}

function updateMasterHash() {
    var should_keep = ($("#keepMasterPasswordHash").attr('checked') == true);
    Settings.setKeepMasterPasswordHash(should_keep);    
    if ( should_keep ) {
      var master_pass = $("#masterPassword").val();
      var new_hash = PasswordMaker_SHA256.any_sha256(master_pass, Settings.masterPasswordCharSet);
      Settings.setMasterPasswordHash(new_hash);    
      $("#master_password_row").css('visibility', 'visible');
    } else {
      Settings.setMasterPasswordHash("");    
      $("#master_password_row").css('visibility', 'hidden');
    }
}

function updateHidePassword() {
    Settings.setHidePassword($("#hidePassword").attr('checked') == true);    
}

$(function() {
    updateProfileList();
    setCurrentProfile(Settings.getProfiles()[0]);
    updateRemoveButton();    

    $("#hidePassword").attr('checked', Settings.shouldHidePassword());
    $("#keepMasterPasswordHash").attr('checked', Settings.keepMasterPasswordHash());
    if (Settings.keepMasterPasswordHash())
      $("#master_password_row").css('visibility', 'visible');
    else
      $("#master_password_row").css('visibility', 'hidden');
});
