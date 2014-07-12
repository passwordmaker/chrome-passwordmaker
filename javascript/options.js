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
    $("#leetLevelLB").prop("disabled", $("#whereLeetLB").val() === "off");
    updateStyle($("#leetLevelLabel"), "disabled", $("#whereLeetLB").val() === "off");
}

function addProfile() {
    var p = new Profile();
    p.title = "No name";
    Settings.addProfile(p);
    updateProfileList();
    setCurrentProfile(p);
}

function removeProfile() {
    if (confirm("Really delete this profile?")) {
        Settings.deleteProfile(Settings.currentProfile);
        updateProfileList();
        setCurrentProfile(Settings.profiles[0]);
    }
}

function removeAllProfiles() {
    if (confirm("Really delete ALL local profile customizations and reset to the default profiles?")) {
        localStorage["profiles"] = "";
        Settings.loadLocalProfiles();
        updateProfileList();
    }
}

function setCurrentProfile(profile) {
    Settings.currentProfile = profile.id;
    $("#profileNameTB").val(profile.title);
    $("#siteList").val(profile.siteList);
    $("#protocolCB").prop("checked", profile.url_protocol);
    $("#subdomainCB").prop("checked", profile.url_subdomain);
    $("#domainCB").prop("checked", profile.url_domain);
    $("#pathCB").prop("checked", profile.url_path);
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
    for (var i = 0; i < CHARSET_OPTIONS.length; i++) {
        $("#charset").append(new Option(CHARSET_OPTIONS[i]));
    }
    $("#charset").append(new Option("Custom charset"));

    if ($("#hashAlgorithmLB")[0].value.length === 0) {
        $("#hashAlgorithmLB").val("bugged");
    }

    if (CHARSET_OPTIONS.indexOf(profile.selectedCharset) >= 0) {
        $("#charset").val(profile.selectedCharset);
    } else {
        $("#charset").val("Custom charset");
        $("#customCharset").val(profile.selectedCharset);
    }

    updateCustomCharsetField();
    updateExample();
    updateLeet();
    highlightProfile();
    // Keeps profile #1 around so it can only be re-named
    if (Settings.profiles[0].id === profile.id) {
        $("#remove").hide();
    } else {
        $("#remove").show();
    }

    showSection("#profile_settings");
}

function updateCustomCharsetField() {
    if ($("#charset").val() === "Custom charset") {
        $("#customCharset").val(Settings.getProfile(Settings.currentProfile).selectedCharset).show();
    } else {
        $("#customCharset").hide();
    }
}

function showImport() {
    showSection("#import_settings");
}

function showExport() {
    showSection("#export_settings");
    $("#exportText").val(RdfImporter.dumpDoc());
}

function importRdf() {
    var txt = $("#importText").val();
    var count = 0;

    if (txt.trim().length === 0) {
        alert("Import text is empty");
        return false;
    }

    var rdfDoc = RdfImporter.loadDoc(txt);
    // Check that profiles have been parsed and are available before wiping current data
    if (rdfDoc && rdfDoc.profiles && rdfDoc.profiles.length && $("#importOverwrite").prop("checked")) {
        Settings.profiles = JSON.parse(JSON.stringify(rdfDoc.profiles));
        Settings.saveProfiles();
        count = rdfDoc.profiles.length;
    } else {
        count = RdfImporter.saveProfiles(rdfDoc.profiles);
    }

    if (count === 0) {
        alert("Sorry, no profiles found");
        return false;
    }

    updateProfileList();
}

function copyRdfExport() {
    document.getElementById("exportText").select();
    document.execCommand("copy");
}

function showOptions() {
    chrome.storage.sync.getBytesInUse(null, function (bytes) {
        if (bytes > 0) {
            Settings.syncDataAvailable = true;
        }
    });

    updateSyncProfiles();
    showSection("#general_settings");
}

function showInformation() {
    showSection("#general_information");
}

function showSection(showId) {
    $("#checkStrength").prop("checked", false);
    showStrengthSection();
    $("section").add("aside").not(showId).hide();
    $(showId).show();
}

function highlightProfile() {
    $(".highlight").removeClass("highlight");
    $("#profile_" + Settings.currentProfile).addClass("highlight");
}

function saveProfile() {
    var selected = Settings.getProfile(Settings.currentProfile);

    selected.title          = $("#profileNameTB").val().trim();
    selected.siteList       = $("#siteList").val().trim();
    selected.url_protocol   = $("#protocolCB").prop("checked");
    selected.url_subdomain  = $("#subdomainCB").prop("checked");
    selected.url_domain     = $("#domainCB").prop("checked");
    selected.url_path       = $("#pathCB").prop("checked");
    selected.strUseText     = $("#inputUseThisText").val().trim();
    selected.whereToUseL33t = $("#whereLeetLB").val();
    selected.l33tLevel      = $("#leetLevelLB").val();
    selected.passwordLength = $("#passwdLength").val();
    selected.username       = $("#usernameTB").val().trim();
    selected.modifier       = $("#modifier").val().trim();
    selected.passwordPrefix = $("#passwordPrefix").val();
    selected.passwordSuffix = $("#passwordSuffix").val();

    // make sure default profile siteList stays blank
    if (selected.title === "Default") {
        selected.siteList = "";
    }

    // Keep old/bugged algorithm unless explicitly changed & saved
    if ($("#hashAlgorithmLB").val() !== "bugged") {
        selected.hashAlgorithm = $("#hashAlgorithmLB").val();
    }

    if ($("#charset").val() === "Custom charset") {
        selected.selectedCharset = $("#customCharset").val();
    } else {
        selected.selectedCharset = $("#charset").val();
    }

    Settings.saveProfiles();
    updateProfileList();
    highlightProfile();
}

function cloneProfile() {
    var p = JSON.parse(JSON.stringify(Settings.getProfile(Settings.currentProfile)));
    p.title = p.title + " Copy";
    Settings.addProfile(p);
    updateProfileList();
    setCurrentProfile(p);
}

function editProfile(event) {
    setCurrentProfile(Settings.getProfile(event.target.id.slice(8)));
}

function updateProfileList() {
    $("#profile_list").empty();
    for (var i = 0; i < Settings.profiles.length; i++) {
        $("#profile_list").append("<li><span id='profile_" + Settings.profiles[i].id + "' class='link'>" + Settings.profiles[i].title + "</span></li>");
    }
}

function setSyncPassword() {
    if ($("#syncProfilesPassword").val() === "") {
        alert("Please enter a password to enable sync");
        return;
    }

    var result = Settings.startSyncWith($("#syncProfilesPassword").val());
    if (result) {
        Settings.setSyncProfiles(true);
        Settings.syncDataAvailable = true;
        Settings.syncPasswordOk = true;
        $("#syncProfilesPassword").val("");
        updateSyncProfiles();
        updateProfileList();
    } else {
        alert("Wrong password. Please specify the password you used when initially syncing your data");
    }
}

function clearSyncData() {
    Settings.clearSyncData(function(success) {
        if (success) {
            Settings.setSyncProfiles(false);
            updateSyncProfiles();
            updateProfileList();
        }
    });
}

function updateSyncProfiles() {
    $("#sync_profiles_row, #no_sync_password, #sync_data_exists, #sync_password_set").hide();
    $("#set_sync_password, #clear_sync_data").addClass("hidden");
    var should_sync = $("#syncProfiles").prop("checked");

    if (should_sync) {
        if (Settings.syncPasswordOk) {
            $("#sync_password_set").show();
            $("#clear_sync_data").removeClass("hidden");
        } else if (Settings.syncDataAvailable) {
            $("#sync_profiles_row, #sync_data_exists").show();
            $("#set_sync_password, #clear_sync_data").removeClass("hidden");
        } else {
            $("#sync_profiles_row, #no_sync_password").show();
            $("#set_sync_password").removeClass("hidden");
        }
    } else {
        Settings.stopSync();
        updateProfileList();
    }
}

function updateMasterHash() {
    var should_keep = $("#keepMasterPasswordHash").prop("checked");
    if (should_keep) {
        $("#master_password_row").removeClass("hidden");
        var master_pass = $("#masterPassword").val();
        if (master_pass.length > 0) {
            Settings.setKeepMasterPasswordHash(true);
            Settings.setMasterPasswordHash(JSON.stringify(Settings.make_pbkdf2(master_pass,"")));
        } else {
            Settings.setKeepMasterPasswordHash(false);
            Settings.setMasterPasswordHash("");
        }
    } else {
        $("#master_password_row").addClass("hidden");
        $("#masterPassword").val("");
        Settings.setKeepMasterPasswordHash(false);
        Settings.setMasterPasswordHash("");
    }
}

function updateHidePassword() {
    Settings.setHidePassword($("#hidePassword").prop("checked"));
}

function updateDisablePasswordSaving() {
    Settings.setDisablePasswordSaving($("#disablePasswordSaving").prop("checked"));
}

function updateUseVerificationCode() {
    Settings.setUseVerificationCode($("#useVerificationCode").prop("checked"));
}

function testPasswordLength() {
    if (this.value < 8) this.value = 8;
    if (this.value > 512) this.value = 512;
}

function fileImport() {
    var file = $("#fileInput")[0].files[0];
    if (file.type.match(/rdf|xml|text/)) {
        var reader = new FileReader();
        reader.onload = function() {
            $("#importText").val(reader.result);
        };
        reader.readAsBinaryString(file);
    } else {
        $("#importText").val("Please select a supported filetype!");
    }
}

function fileExport() {
    var textFileAsBlob = new Blob([$("#exportText").val()], {type: "application/rdf+xml"});
    var downloadLink = document.createElement("a");
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.download = "PasswordMaker Pro Profile Data.rdf";
    downloadLink.click();
}

// strength calculation based on Firefox version
function getPasswordStrength(pw) {
    // char frequency
    var uniques = [];
    for (var i = 0; i < pw.length; i++) {
        for (var j = 0; j < uniques.length; j++) {
            if (i === j) continue;
            if (pw[i] === uniques[j]) break;
        }
        if (j === uniques.length) uniques.push(pw[i]);
    }
    var r0 = uniques.length / pw.length;
    if (uniques.length === 1) r0 = 0;

    //length of the password - 1pt per char over 5, up to 15 for 10 pts total
    var r1 = pw.length;
    if (r1 >= 15) {
        r1 = 10;
    } else if (r1 < 5) {
        r1 = -5;
    } else {
        r1 -= 5;
    }

    var quarterLen = Math.round(pw.length / 4);

    //ratio of numbers in the password
    var c = pw.replace(/[0-9]/g, "");
    var nums = (pw.length - c.length);
    c = nums > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - nums);
    var r2 = 1 - (c / quarterLen);

    //ratio of symbols in the password
    c = pw.replace(/\W/g, "");
    var syms = (pw.length - c.length);
    c = syms > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - syms);
    var r3 = 1 - (c / quarterLen);

    //ratio of uppercase in the password
    c = pw.replace(/[A-Z]/g, "");
    var upper = (pw.length - c.length);
    c = upper > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - upper);
    var r4 = 1 - (c / quarterLen);

    //ratio of lowercase in the password
    c = pw.replace(/[a-z]/g, "");
    var lower = (pw.length - c.length);
    c = lower > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - lower);
    var r5 = 1 - (c / quarterLen);

    var pwstrength = (((r0 + r2 + r3 + r4 + r5) / 5) * 100) + r1;

    // make sure we're give a value between 0 and 100
    if (pwstrength < 0) pwstrength = 0;
    if (pwstrength > 100) pwstrength = 100;

    return { // return strength as an integer + boolean usage of character type
        strength: pwstrength |0,
        hasUpper: Boolean(upper),
        hasLower: Boolean(lower),
        hasDigit: Boolean(nums),
        hasSymbol: Boolean(syms)
    }
}

function showStrengthSection() {
    if ($("#checkStrength").prop("checked")) {
        $("main").width("1150px");
        $("#strength_section").css("display", "inline-block");
        $(".testInput").on("change keyup", checkPassStrength);
        checkPassStrength();
    } else {
        $("main").width("900px");
        $("#strength_section").hide();
        $(".testInput").off("change keyup", checkPassStrength);
        $(".strengthInput").val("");
    }
}

function checkPassStrength() {
    var testPass = $("#testPass").val();
    var selected = Settings.getProfile(Settings.currentProfile);

    selected.siteList       = $("#siteList").val().trim();
    selected.url_protocol   = $("#protocolCB").prop("checked");
    selected.url_subdomain  = $("#subdomainCB").prop("checked");
    selected.url_domain     = $("#domainCB").prop("checked");
    selected.url_path       = $("#pathCB").prop("checked");
    selected.strUseText     = $("#inputUseThisText").val().trim();
    selected.whereToUseL33t = $("#whereLeetLB").val();
    selected.l33tLevel      = $("#leetLevelLB").val();
    selected.passwordLength = $("#passwdLength").val();
    selected.username       = $("#usernameTB").val().trim();
    selected.modifier       = $("#modifier").val().trim();
    selected.passwordPrefix = $("#passwordPrefix").val();
    selected.passwordSuffix = $("#passwordSuffix").val();

    if ($("#hashAlgorithmLB").val() !== "bugged") {
        selected.hashAlgorithm = $("#hashAlgorithmLB").val();
    } else {
        selected.hashAlgorithm = "md5";
    }

    if ($("#charset").val() === "Custom charset") {
        selected.selectedCharset = $("#customCharset").val();
    } else {
        selected.selectedCharset = $("#charset").val();
    }

    if (selected.getText().length !== 0) {
        $("#testText").val(selected.getText());
    } else {
        $("#testText").val(selected.getUrl(selected.siteList));
    }

    $("#genPass").val(selected.getPassword($("#testText").val(), testPass));
    var values = getPasswordStrength($("#genPass").val());
    $("#genStrength, meter").val(values.strength);
    $("#hasUpper").prop("checked", values.hasUpper)
    $("#hasLower").prop("checked", values.hasLower)
    $("#hasDigit").prop("checked", values.hasDigit)
    $("#hasSymbol").prop("checked", values.hasSymbol)
}

$(function() {
    Settings.loadProfiles();
    updateProfileList();
    setCurrentProfile(Settings.profiles[0]);

    $("#hidePassword").prop("checked", Settings.shouldHidePassword());
    $("#disablePasswordSaving").prop("checked", Settings.shouldDisablePasswordSaving());
    $("#keepMasterPasswordHash").prop("checked", Settings.keepMasterPasswordHash());
    $("#useVerificationCode").prop("checked", Settings.useVerificationCode());

    if (Settings.keepMasterPasswordHash()) {
        $("#master_password_row").removeClass("hidden");
    } else {
        $("#master_password_row").addClass("hidden");
    }

    $("#syncProfiles").prop("checked", Settings.shouldSyncProfiles());

    $("#profile_list").on("click", ".link", editProfile);
    $("#add").on("click", addProfile);
    $("#showImport").on("click", showImport);
    $("#showExport").on("click", showExport);
    $("#showSettings").on("click", showOptions);
    $("#showInformation").on("click", showInformation);

    $("#protocolCB").on("change", updateExample);
    $("#subdomainCB").on("click", updateExample);
    $("#domainCB").on("click", updateExample);
    $("#pathCB").on("click", updateExample);
    $("#whereLeetLB").on("change", updateLeet);
    $("#charset").on("change", updateCustomCharsetField);

    $("#cloneProfileButton").on("click", cloneProfile);
    $("#checkStrength").on("change", showStrengthSection);
    $("#remove").on("click", removeProfile);
    $("#save").on("click", saveProfile);
    $("#importButton").on("click", importRdf);
    $("#fileInput").on("change", fileImport);
    $("#copyButton").on("click", copyRdfExport);
    $("#exportFileButton").on("click", fileExport);

    $("#hidePassword").on("change", updateHidePassword);
    $("#disablePasswordSaving").on("change", updateDisablePasswordSaving);
    $("#keepMasterPasswordHash").on("change", updateMasterHash);
    $("#syncProfiles").on("change", updateSyncProfiles);
    $("#masterPassword").on("keyup", updateMasterHash);
    $("#useVerificationCode").on("change", updateUseVerificationCode);
    $("#set_sync_password").on("click", setSyncPassword);
    $("#clear_sync_data").on("click", clearSyncData);
    $("#resetToDefaultprofiles").on("click", removeAllProfiles);

    $("#passwdLength").on("blur", testPasswordLength);
});
