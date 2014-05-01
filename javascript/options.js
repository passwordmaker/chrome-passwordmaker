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
    updateStyle($("#exprotocol"), "selected", $("#protocolCB").prop("checked"));
    updateStyle($("#exsubdomain"), "selected", $("#subdomainCB").prop("checked"));
    updateStyle($("#exdomain"), "selected", $("#domainCB").prop("checked"));
    updateStyle($("#expath"), "selected", $("#pathCB").prop("checked"));
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
    $("#protocolCB").prop('checked', profile.url_protocol);
    $("#subdomainCB").prop('checked', profile.url_subdomain);
    $("#domainCB").prop('checked', profile.url_domain);
    $("#pathCB").prop('checked', profile.url_path);
    
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
    if ((rdfDoc && rdfDoc.profiles && rdfDoc.profiles.length) && ($('#inputImportOverwrite').prop('checked') == true)) {
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

function showInformation() {
    showSection('#general_information');
}

function showSection(showId) {
    if(!$(showId).is(":visible")){
        $('#profile_setting:visible,#import_settings:visible,#export_settings:visible,#general_settings:visible,#general_information:visible')
        .hide(0, function(){
            $(showId).show();
        });
    }
}

function highlightProfile(){
    $("#profile_id_" + currentProfile.id).toggleClass("highlight");
}

function saveProfile() {
    currentProfile.title = $("#profileNameTB").val();
    currentProfile.siteList       = $("#siteList").val();
    currentProfile.url_protocol = $("#protocolCB").prop('checked');
    currentProfile.url_subdomain = $("#subdomainCB").prop('checked');
    currentProfile.url_domain = $("#domainCB").prop('checked');
    currentProfile.url_path = $("#pathCB").prop('checked');
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
        $("#editProfile_"+id).on('click', {id: id}, editProfile);
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

    var should_sync = ($("#syncProfiles").prop('checked') == true);
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
    var should_keep = ($("#keepMasterPasswordHash").prop('checked') == true);
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
    Settings.setHidePassword($("#hidePassword").prop('checked') == true);    
}

function updateDisablePasswordSaving() {
    Settings.setDisablePasswordSaving($("#disablePasswordSaving").prop('checked') == true);
}

function testPasswordLength() {
    if (/\D/.test(this.value)) this.value='8';
}

$(function() {
    updateProfileList();
    setCurrentProfile(Settings.getProfiles()[0]);
    updateRemoveButton();    

    $("#hidePassword").prop('checked', Settings.shouldHidePassword());
    $("#disablePasswordSaving").prop('checked', Settings.shouldDisablePasswordSaving());
    $("#keepMasterPasswordHash").prop('checked', Settings.keepMasterPasswordHash());
    if (Settings.keepMasterPasswordHash())
      $("#master_password_row").css('visibility', 'visible');
    else
      $("#master_password_row").css('visibility', 'hidden');

    $("#syncProfiles").prop('checked', Settings.shouldSyncProfiles());
    updateSyncProfiles();
    
    $("#add>a").on('click', addProfile);
    $("#showImport>a").on('click', showImport);
    $("#showExport>a").on('click', showExport);
    $("#showSettings>a").on('click', showOptions);
    $("#showInformation>a").on('click', showInformation);

    $("#protocolCB").on('change', updateExample);
    $("#subdomainCB").on('click', updateExample);
    $("#domainCB").on('click', updateExample);
    $("#pathCB").on('click', updateExample);
    $("#whereLeetLB").on('change', updateLeet);

    $("#cloneProfileButton").on('click', cloneProfile);
    $("#remove>a").on('click', removeProfile);
    $("#save>a").on('click', saveProfile);
    $("#import_buttons>a").on('click', importRdf);
    $("#export_buttons>a").on('click', copyRdfExport);

    $("#hidePassword").on('change', updateHidePassword);
    $("#disablePasswordSaving").on('change', updateDisablePasswordSaving);
    $("#keepMasterPasswordHash").on('change', updateMasterHash);
    $("#syncProfiles").on('change', updateSyncProfiles);
    $("#masterPassword").on('blur', updateMasterHash);

    $("#set_sync_password").on('click', setSyncPassword);
    $("#clear_sync_data").on('click', clearSyncData);

    $("#passwdLength").on('change keyup keydown keypress input', testPasswordLength);
});

