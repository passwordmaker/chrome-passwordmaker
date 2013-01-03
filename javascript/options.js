var currentProfile = null;

var CHARSET_OPTIONS = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\\:\";'<>?,./",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    "0123456789abcdef",
    "0123456789",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "`~!@#$%^&*()_-+={}|[]:\";'<>?,./"
];

function editProfile(event) {
    p = Settings.getProfile(event.data.id);
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
    $("#siteList").val(profile.siteList);
    $("#protocolCB").attr('checked', profile.url_protocol);
    $("#subdomainCB").attr('checked', profile.url_subdomain);
    $("#domainCB").attr('checked', profile.url_domain);
    $("#pathCB").attr('checked', profile.url_path);
    
    $("#inputUseThisText").val(profile.strUseText);
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
    
    showSection('#profile_setting');
}

function showImport(){
    showSection('#import_settings');
}

function showExport(){
    showSection('#export_settings');
    $('#exportText').val(RdfImporter.dumpDoc());
}

function importRdf(){
    var txt = $('#importText').val();

    if(!txt.length){
        alert("Import text is empty");
        return false;
    }

    var rdfDoc = RdfImporter.loadDoc(txt);

    // Check that profiles have been parsed and are available before wiping current data
    if ((rdfDoc && rdfDoc.profiles && rdfDoc.profiles.length) && ($('#inputImportOverwrite').attr('checked') == true)) {
        // Setting to null triggers creation of default profile, settings to empty array bypasses that code ([] != null)
        Settings.profiles = [];
        Settings.saveProfiles();
    }
    
    var count = RdfImporter.saveProfiles(rdfDoc.profiles);

    if(!count){
      alert("Sorry, no profiles found");
      return false;
    }

    updateProfileList();
    updateRemoveButton();
}

function copyRdfExport(){
    $('#exportText').select();
    document.execCommand("Copy");
}

function showOptions() {
    showSection('#general_settings');
}

function showSection(showId) {
    if(!$(showId).is(":visible")){
        $('#profile_setting:visible,#import_settings:visible,#export_settings:visible,#general_settings:visible')
            .fadeOut(300, function(){
                $(showId).fadeIn(300);
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
    currentProfile.siteList       = $("#siteList").val();
    currentProfile.url_protocol = $("#protocolCB").attr('checked');
    currentProfile.url_subdomain = $("#subdomainCB").attr('checked');
    currentProfile.url_domain = $("#domainCB").attr('checked');
    currentProfile.url_path = $("#pathCB").attr('checked');
    currentProfile.strUseText = $("#inputUseThisText").val();
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
    
    Settings.setProfile(currentProfile);
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
        list += "<li id='profile_id_"+profile.id+"'><a id='editProfile_"+profile.id+"' href='#'>"+profile.title+"</a></li>";
    }
    $("#profile_list").empty().append(list);

    for (var i in profiles) {
        var id = profiles[i].id;
        $("#editProfile_"+id).bind('click', {id: id}, editProfile);
    }
}

function setSyncPassword() {
    if ($("#syncProfilesPassword").val() == "") {
        return;
    }

    var result = Settings.startSyncWith($("#syncProfilesPassword").val());
    if (result != null) {
        Settings.setSyncProfiles(true);
        Settings.setSyncProfilesPassword(result);
        $("#syncProfilesPassword").val("");
        updateSyncProfiles();
        updateProfileList();
        updateRemoveButton();
    } else {
        alert("Wrong password. Please specify the password you used when " +
              "initially syncing your data");
    }
}

function clearSyncData() {
    Settings.clearSyncData(function(success) {
        if (success) {
            Settings.setSyncProfiles(false);

            updateSyncProfiles();
            updateProfileList();
            updateRemoveButton();
        }
    });
}

function updateSyncProfiles() {
    $("#sync_profiles_row").css('display', 'none');

    $("#no_sync_password").css('display', 'none');
    $("#sync_data_exists").css('display', 'none');
    $("#sync_password_set").css('display', 'none');

    $("#set_sync_password").css('visibility', 'hidden');
    $("#clear_sync_data").css('visibility', 'hidden');

    var should_sync = ($("#syncProfiles").attr('checked') == true);
    if (should_sync) {
      if (Settings.syncPasswordOk) {
          $("#sync_password_set").css('display', 'block');
          $("#clear_sync_data").css('visibility', 'visible');
      } else if (Settings.syncDataAvailable) {
          $("#sync_profiles_row").css('display', 'block');
          $("#sync_data_exists").css('display', 'block');
          $("#set_sync_password").css('visibility', 'visible');
          $("#clear_sync_data").css('visibility', 'visible');
      } else {
          $("#sync_profiles_row").css('display', 'block');
          $("#no_sync_password").css('display', 'block');
          $("#set_sync_password").css('visibility', 'visible');
      }
    } else {
      Settings.stopSync();

      updateProfileList();
      updateRemoveButton();
    }
}

function updateMasterHash() {
    var should_keep = ($("#keepMasterPasswordHash").attr('checked') == true);
    Settings.setKeepMasterPasswordHash(should_keep);    
    if ( should_keep ) {
      var master_pass = $("#masterPassword").val();
      var new_hash = ChromePasswordMaker_SecureHash.make_hash(master_pass);
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

function testPasswordLength() {
    if (/\D/.test(this.value)) this.value='8';
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

    $("#syncProfiles").attr('checked', Settings.shouldSyncProfiles());
    updateSyncProfiles();
    
    $("#add>a").bind('click', addProfile);
    $("#showImport>a").bind('click', showImport);
    $("#showExport>a").bind('click', showExport);
    $("#showSettings>a").bind('click', showOptions);

    $("#protocolCB").bind('change', updateExample);
    $("#subdomainCB").bind('click', updateExample);
    $("#domainCB").bind('click', updateExample);
    $("#pathCB").bind('click', updateExample);
    $("#whereLeetLB").bind('change', updateLeet);

    $("#cloneProfileButton").bind('click', cloneProfile);
    $("#remove>a").bind('click', removeProfile);
    $("#save>a").bind('click', saveProfile);
    $("#import_buttons>a").bind('click', importRdf);
    $("#export_buttons>a").bind('click', copyRdfExport);

    $("#hidePassword").bind('change', updateHidePassword);
    $("#keepMasterPasswordHash").bind('change', updateMasterHash);
    $("#syncProfiles").bind('change', updateSyncProfiles);
    $("#masterPassword").bind('blur', updateMasterHash);

    $("#set_sync_password").bind('click', setSyncPassword);
    $("#clear_sync_data").bind('click', clearSyncData);

    $("#passwdLength").bind('change keyup keydown keypress input', testPasswordLength);
});

