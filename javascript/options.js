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
    var p = Object.create(Profile);
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
        chrome.storage.local.remove("profiles").then(() => {
            Settings.loadProfiles(() => {
                updateProfileList();
            });
        })
    }
}

function setCurrentProfile(profile) {
    Settings.currentProfile = profile.id;
    $("#profileNameTB").val(profile.title);
    $("#siteList").val((profile.siteList).replace(/\s/g, "\n"));
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

    if (CHARSET_OPTIONS.includes(profile.selectedCharset)) {
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
    oldHashWarning(profile.hashAlgorithm);
}

function updateCustomCharsetField() {
    if ($("#charset").val() === "Custom charset") {
        $("#customCharset").val(Settings.getProfile(Settings.currentProfile).selectedCharset).show();
    } else {
        $("#customCharset").hide();
    }
}

function oldHashWarning(hash) {
    // Be as annoying as possible to try and stop people from using the bugged algorithms
    var bugged = {
        "md5_v6": 1,
        "hmac-md5_v6": 1,
        "hmac-sha256": 1
    };
    if (bugged[hash]) {
        if (confirm("Are you sure you want to continue using a legacy algorithm which is incorrectly implemented?")) {
            alert("Please change to using a correct & secure algorithm!\n\nThe old/bugged/legacy algorithms " +
                "are harmful to your online security and should be avoided at ALL costs.\n\n" +
                "Please change your passwords on the sites which you are using this algorithm if you are able to " +
                "as soon as possible.\n\nThank you\n");
        } else {
            alert("Please select one of the correct and secure hash algorithms below :)");
        }
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

    if (txt.trim().length === 0) {
        alert("Import text is empty");
        return false;
    }

    var rdfDoc = RdfImporter.loadDoc(txt);
    // Check that profiles have been parsed and are available before wiping current data
    if (rdfDoc.profiles.length > 0 && $("#importOverwrite").prop("checked")) {
        Settings.profiles = [];
    }

    if (RdfImporter.saveProfiles(rdfDoc.profiles) === 0) {
        alert("Sorry, no profiles found");
        return false;
    }

    updateProfileList();
}

function copyRdfExport() {
    navigator.clipboard.writeText($("#exportText").val()).then(() => {
        $("#exportText").get(0).select();
    });
}

function showOptions() {
    chrome.storage.sync.get().then((result) => {
        if (Object.keys(result).length > 0) {
            chrome.storage.local.set({ "syncDataAvailable": true });
        } else {
            chrome.storage.local.set({ "syncDataAvailable": false });
        }
    });

    chrome.storage.local.get(["storeLocation", "expire_password_minutes", "keep_master_password_hash"]).then((result) => {
        $("#store_location").val(result["storeLocation"]);
        $("#expirePasswordMinutes").val(result["expire_password_minutes"] || 5);
        updateStyle($("#password_expire_row"), "hidden", (result["storeLocation"] !== "memory_expire"));
        updateStyle($("#master_password_row"), "hidden", (result["keep_master_password_hash"] === undefined || result["keep_master_password_hash"] === false));
        showSection("#general_settings");
    }).finally(() => {
        updateSyncStatus();
    });
}

function showInformation() {
    showSection("#general_information");
}

function showSection(showId) {
    $("#checkStrength").prop("checked", false);
    showStrengthSection();
    $("section").add("aside").not(showId).css("display", "none");
    $(showId).css("display", "block");
}

function highlightProfile() {
    $(".highlight").removeClass("highlight");
    $("#profile_" + Settings.currentProfile).addClass("highlight");
}

function updateStorageLocation() {
    var storeLocation = $("#store_location").val();
    chrome.storage.local.set({ "storeLocation": storeLocation }).then(() => {
        Settings.setStoreLocation(storeLocation);
        updateStyle($("#password_expire_row"), "hidden", (storeLocation !== "memory_expire"));
    });
}

function saveProfile() {
    var selected = Settings.getProfile(Settings.currentProfile);

    selected.title          = $("#profileNameTB").val().trim();
    selected.siteList       = $("#siteList").val().trim().split(/\s+/).join(" ");
    selected.url_protocol   = $("#protocolCB").prop("checked");
    selected.url_subdomain  = $("#subdomainCB").prop("checked");
    selected.url_domain     = $("#domainCB").prop("checked");
    selected.url_path       = $("#pathCB").prop("checked");
    selected.strUseText     = $("#inputUseThisText").val().trim();
    selected.whereToUseL33t = $("#whereLeetLB").val();
    selected.l33tLevel      = $("#leetLevelLB").val();
    selected.hashAlgorithm  = $("#hashAlgorithmLB").val();
    selected.passwordLength = $("#passwdLength").val();
    selected.username       = $("#usernameTB").val().trim();
    selected.modifier       = $("#modifier").val().trim();
    selected.passwordPrefix = $("#passwordPrefix").val();
    selected.passwordSuffix = $("#passwordSuffix").val();

    // make sure default profile siteList and strUseText stays blank/generic
    if (Settings.profiles[0].id === selected.id) {
        selected.siteList = "";
        selected.strUseText = "";
    }

    if ($("#charset").val() === "Custom charset") {
        selected.selectedCharset = $("#customCharset").val();
    } else {
        selected.selectedCharset = $("#charset").val();
    }

    Settings.saveProfiles();
    updateProfileList();
    setCurrentProfile(selected);
    highlightProfile();
    oldHashWarning(selected.hashAlgorithm);
}

function cloneProfile() {
    var p = Object.assign(Object.create(Profile), Settings.getProfile(Settings.currentProfile));
    p.title = p.title + " Copy";
    Settings.addProfile(p);
    updateProfileList();
    setCurrentProfile(p);
}

function editProfile(event) {
    setCurrentProfile(Settings.getProfile(event.target.id.slice(8)));
}

function updateProfileList() {
    chrome.storage.local.get(["alpha_sort_profiles"]).then((result) => {
        if (result["alpha_sort_profiles"]) Settings.alphaSortProfiles();

        $("#profile_list").empty();
        for (var i = 0; i < Settings.profiles.length; i++) {
            $("#profile_list").append(`<li><span id='profile_${Settings.profiles[i].id}' class='link'>${Settings.profiles[i].title}</span></li>`);
        }
    });
}

function syncSucccess(syncPassHash) {
    chrome.storage.local.set({ "sync_profiles": true, "sync_profiles_password": syncPassHash }).then(() => {
        $("#syncProfilesPassword").val("");
        
        return updateProfileList();
    }).then(() => {
        //Settings.saveSyncedProfiles(Settings.encrypt(syncPassHash, JSON.stringify(Settings.profiles)));
        //Settings.saveProfiles();
        return Settings.saveSyncedProfiles(JSON.stringify(Settings.profiles), syncPassHash);
    }).finally(() => {
        setTimeout(() => {
            updateSyncStatus();
        }, 500);
    });
}

function setSyncPassword() {
    var syncPassValue = $("#syncProfilesPassword").val().trim();
    if (syncPassValue.length === 0) {
        alert("Please enter a password to enable sync");
        return;
    }

    chrome.storage.local.get(["syncDataAvailable"]).then((result) => {
        var syncPassHash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(syncPassValue));
        if (result["syncDataAvailable"] === true) {
            chrome.storage.sync.get(["synced_profiles", "synced_profiles_keys", "sync_profiles_password"]).then((result) => {
                //var profiles = Settings.decrypt(syncPassHash, result["synced_profiles"]);
                if (syncPassHash === result["sync_profiles_password"]) {
                    Settings.loadProfilesFromString(result["synced_profiles"]);
                    syncSucccess(syncPassHash);
                } else {
                    alert("Wrong password. Please specify the password you used when initially synced your data");
                }
            });
        } else {
            syncSucccess(syncPassHash);
        }
    });
}

function clearSyncData() {
    chrome.storage.sync.clear().then(() => {
        chrome.storage.local.set({ "sync_profiles": false }).then(() => {
            return chrome.storage.local.remove(["synced_profiles", "synced_profiles_keys", "sync_profiles_password"]);
        }).then(() => {
            Settings.loadProfiles(() => {
                setTimeout(() => {
                    updateSyncStatus();
                }, 500);
                updateProfileList();
            });
        });
    });
}

function updateSyncStatus() {
    $("#sync_profiles_row, #no_sync_password, #sync_data_exists, #sync_password_set").hide();
    $("#set_sync_password, #clear_sync_data").addClass("hidden");

    if ($("#syncProfiles").prop("checked")) {
        chrome.storage.local.get(["syncDataAvailable", "sync_profiles_password", "synced_profiles"]).then((result) => {
            //var syncHash = result["sync_profiles_password"] || "";
            //var profiles = Settings.decrypt(syncHash, result["synced_profiles"]);
            var profiles = result["synced_profiles"];
            if ((profiles !== undefined) && (profiles.length !== 0) && result["syncDataAvailable"]) {
                $("#sync_password_set").show();
                $("#clear_sync_data").removeClass("hidden");
            } else if (result["syncDataAvailable"]) {
                $("#sync_profiles_row, #sync_data_exists").show();
                $("#set_sync_password, #clear_sync_data").removeClass("hidden");
            } else {
                $("#sync_profiles_row, #no_sync_password").show();
                $("#set_sync_password").removeClass("hidden");
            }
        });
    } else {
        chrome.storage.local.set({ "sync_profiles": false }).then((result) => {
            chrome.storage.local.remove(["synced_profiles", "sync_profiles_password"]);
            Settings.loadProfiles(() => {
                updateProfileList();
            });
        });
    }
}

function updateMasterHash() {
    if ($("#keepMasterPasswordHash").prop("checked")) {
        $("#master_password_row").removeClass("hidden");
        var master_pass = $("#masterPassword").val();
        if (master_pass.length > 0) {
            chrome.storage.local.set({ "keep_master_password_hash": true });
            chrome.storage.local.set({ "master_password_hash": JSON.stringify(Settings.make_pbkdf2(master_pass)) });
        } else {
            chrome.storage.local.set({ "keep_master_password_hash": false });
            chrome.storage.local.remove("master_password_hash");
        }
    } else {
        $("#master_password_row").addClass("hidden");
        $("#masterPassword").val("");
        chrome.storage.local.set({ "keep_master_password_hash": false });
        chrome.storage.local.remove("master_password_hash");
    }
}

function updateHidePassword() {
    chrome.storage.local.set({ "show_generated_password": $("#hidePassword").prop("checked") });
}

function updateUseVerificationCode() {
    chrome.storage.local.set({ "use_verification_code": $("#useVerificationCode").prop("checked") });
}

function updateShowStrength() {
    chrome.storage.local.set({ "show_password_strength": $("#showPasswordStrength").prop("checked") });
}

function updateAlphaSortProfiles() {
    chrome.storage.local.set({ "alpha_sort_profiles": $("#alphaSortProfiles").prop("checked") }).then(() => {
        Settings.loadProfiles(() => {
            updateProfileList();
            filterProfiles()
        });
    });

}

function sanitizePasswordLength() {
    var field = $("#passwdLength");
    if (field.val() < 4) field.val("4");
    if (field.val() > 512) field.val("512");
}

function sanitizeExpireTime(newExpireTime) {
    var field = $("#expirePasswordMinutes");
    if (newExpireTime < 1) {
        newExpireTime = 1;
        field.val("1");
    }
    if (newExpireTime > 720) {
        newExpireTime = 720;
        field.val("720");
    }
    newExpireTime = parseInt(newExpireTime, 10);
    field.val(newExpireTime);
    return newExpireTime;
}

function updateExpireTime() {
    chrome.storage.local.get(["expire_password_minutes", "storeLocation"]).then((result) => {
        var oldExpireTime = result["expire_password_minutes"] || 5;
        var newExpireTime = $("#expirePasswordMinutes").val();
        if (result["storeLocation"] === "memory_expire") {
            newExpireTime = sanitizeExpireTime(newExpireTime);
            if (newExpireTime !== oldExpireTime) {
                chrome.storage.local.set({ "expire_password_minutes": newExpireTime }).then(() => {
                    Settings.createExpirePasswordAlarm(newExpireTime);
                });
            }
        } else {
            chrome.alarms.clear("expire_password");
        }
    });
}

function fileImport() {
    var file = $("#fileInput")[0].files[0];
    if ((/rdf|xml/i).test(file.type)) {
        var reader = new FileReader();
        reader.onload = () => {
            $("#importText").val(reader.result);
        };
        reader.readAsText(file);
    } else {
        $("#importText").val("Please select an RDF or XML file containing PasswordMaker profile data.");
    }
}

function fileExport() {
    var textFileAsBlob = new Blob([$("#exportText").val()], {
        type: "application/rdf+xml"
    });
    var downloadLink = document.createElement("a");
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.download = "PasswordMaker.org Profile Data.rdf";
    downloadLink.click();
}

function showStrengthSection() {
    if ($("#checkStrength").prop("checked")) {
        $("#strength_section").css("display", "inline-block");
        $(".testInput").on("change keyup", checkPassStrength);
        checkPassStrength();
    } else {
        $("#strength_section").hide();
        $(".testInput").off("change keyup", checkPassStrength);
        $(".strengthInput").val("");
    }
}

function filterProfiles() {
    var filter = document.getElementById("searchProfiles").value.toUpperCase();
    var list = document.getElementById("profile_list").getElementsByTagName("li");

    // Loop through all list items, and hide those which don't match the search query
    for (var i = 0; i < list.length; i++) {
        var items = list[i].getElementsByTagName("span")[0];
        if (items.innerHTML.toUpperCase().includes(filter)) {
            list[i].style.display = "";
        } else {
            list[i].style.display = "none";
        }
    }
}

function checkPassStrength() {
    var selected = Settings.getProfile(Settings.currentProfile);

    selected.siteList       = $("#siteList").val().trim().replace(/[*?$+()^\[\]\\|{},]/g, "").split(/\s+/).shift();
    selected.url_protocol   = $("#protocolCB").prop("checked");
    selected.url_subdomain  = $("#subdomainCB").prop("checked");
    selected.url_domain     = $("#domainCB").prop("checked");
    selected.url_path       = $("#pathCB").prop("checked");
    selected.strUseText     = $("#inputUseThisText").val().trim();
    selected.whereToUseL33t = $("#whereLeetLB").val();
    selected.l33tLevel      = $("#leetLevelLB").val();
    selected.hashAlgorithm  = $("#hashAlgorithmLB").val();
    selected.passwordLength = $("#passwdLength").val();
    selected.username       = $("#usernameTB").val().trim();
    selected.modifier       = $("#modifier").val().trim();
    selected.passwordPrefix = $("#passwordPrefix").val();
    selected.passwordSuffix = $("#passwordSuffix").val();

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

    $("#genPass").val(selected.getPassword($("#testText").val(), $("#testPass").val(), selected.username));
    var values = Settings.getPasswordStrength($("#genPass").val());
    $("#genStrength, meter").val(values.strength);
    $("#hasUpper").prop("checked", values.hasUpper);
    $("#hasLower").prop("checked", values.hasLower);
    $("#hasDigit").prop("checked", values.hasDigit);
    $("#hasSymbol").prop("checked", values.hasSymbol);
}

document.addEventListener("DOMContentLoaded", () => {
    Settings.loadProfiles(() => {
        updateProfileList();
        setCurrentProfile(Settings.profiles[0]);

        chrome.storage.local.get(["show_generated_password", "sync_profiles", "keep_master_password_hash", "use_verification_code", "show_password_strength", "alpha_sort_profiles"]).then((result) => {
            $("#hidePassword").prop("checked", result["show_generated_password"]);
            $("#keepMasterPasswordHash").prop("checked", result["keep_master_password_hash"]);
            $("#useVerificationCode").prop("checked", result["use_verification_code"]);
            $("#showPasswordStrength").prop("checked", result["show_password_strength"]);
            $("#syncProfiles").prop("checked", result["sync_profiles"]);
            $("#alphaSortProfiles").prop("checked", result["alpha_sort_profiles"]);
        });

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
        $("#passwdLength").on("blur", sanitizePasswordLength);

        $("#cloneProfileButton").on("click", cloneProfile);
        $("#checkStrength").on("change", showStrengthSection);
        $("#remove").on("click", removeProfile);
        $("#save").on("click", saveProfile);
        $("#importButton").on("click", importRdf);
        $("#fileInput").on("change", fileImport);
        $("#copyButton").on("click", copyRdfExport);
        $("#exportFileButton").on("click", fileExport);

        $("#store_location").on("change", updateStorageLocation);
        $("#expirePasswordMinutes").on("change", updateExpireTime);
        $("#hidePassword").on("change", updateHidePassword);
        $("#keepMasterPasswordHash").on("change", updateMasterHash);
        $("#syncProfiles").on("change", updateSyncStatus);
        $("#masterPassword").on("keyup", updateMasterHash);
        $("#useVerificationCode").on("change", updateUseVerificationCode);
        $("#showPasswordStrength").on("change", updateShowStrength);
        $("#alphaSortProfiles").on("change", updateAlphaSortProfiles);
        $("#set_sync_password").on("click", setSyncPassword);
        $("#syncProfilesPassword").on("keydown", (event) => {
            if (event.code === "Enter") setSyncPassword();
        })
        $("#clear_sync_data").on("click", clearSyncData);
        $("#resetToDefaultprofiles").on("click", removeAllProfiles);
        $("#searchProfiles").on("input", filterProfiles);
    });
});
