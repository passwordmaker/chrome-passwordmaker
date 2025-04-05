function formatLastModTime(lastmod0) {
    var lastmod = parseInt(lastmod0,10);
    if (lastmod > 0) {
        var t = new Date(lastmod);
        return t.toLocaleString();
    } else {
        return "unknown";
    }
}

function qs$(sel) {
    return document.querySelector(sel);
}

function qsa$(sel) {
    return document.querySelectorAll(sel);
}

function updateStyle(element, selected, isSelected) {
    if (isSelected) {
        element.classList.add(selected);
    } else {
        element.classList.remove(selected);
    }
}

function updateExample() {
    updateStyle(qs$("#exprotocol"), "selected", qs$("#protocolCB").checked);
    updateStyle(qs$("#exsubdomain"), "selected", qs$("#subdomainCB").checked);
    updateStyle(qs$("#exdomain"), "selected", qs$("#domainCB").checked);
    updateStyle(qs$("#expath"), "selected", qs$("#pathCB").checked);
}

function updateLeet() {
    qs$("#leetLevelLB").disabled = (qs$("#whereLeetLB").value === "off");
    updateStyle(qs$("#leetLevelLabel"), "disabled", qs$("#whereLeetLB").value === "off");
}

function addProfile() {
    var p = new Profile();
    p.title = "No name";
    p.timestamp = Date.now();
    Settings.addProfile(p);
    updateProfileList()
        .then(() => setCurrentProfile(p))
        .catch((err) => console.trace(`Could not run addProfile: ${err}`));
}

function removeProfile() {
    if (confirm("Really delete this profile?")) {
        Settings.deleteProfile(Settings.currentProfile);
        updateProfileList();
        setCurrentProfile(Settings.profiles[0]);
    }
}

function removeAllProfiles() {
    if (confirm("Really delete ALL local AND synced profile customizations and reset to the default profiles?")) {
        chrome.storage.local.remove(["profiles", "synced_profiles"])
            .then(() => clearSyncData())
            .then(() => qs$("#syncProfiles").checked = false)
            .then(() => Settings.loadProfiles())
            .then(() => updateProfileList())
            .catch((err) => console.trace(`Could not run removeAllProfiles: ${err}`));
    }
}

function setCurrentProfile(profile) {
    Settings.currentProfile = profile.id;
    qs$("#profileNameTB").value = profile.title;
    qs$("#profileTimeStamp").value = formatLastModTime(profile.timestamp);
    qs$("#siteList").value = (profile.siteList).replace(/\s/g, "\n");
    qs$("#protocolCB").checked = profile.url_protocol;
    qs$("#subdomainCB").checked = profile.url_subdomain;
    qs$("#domainCB").checked = profile.url_domain;
    qs$("#pathCB").checked = profile.url_path;
    qs$("#inputUseThisText").value = profile.strUseText;
    qs$("#whereLeetLB").value = profile.whereToUseL33t;
    qs$("#leetLevelLB").value = profile.l33tLevel;
    qs$("#hashAlgorithmLB").value = profile.hashAlgorithm;
    qs$("#passwdLength").value = profile.passwordLength;
    qs$("#usernameTB").value = profile.username;
    qs$("#modifier").value = profile.modifier;
    qs$("#passwordPrefix").value = profile.passwordPrefix;
    qs$("#passwordSuffix").value = profile.passwordSuffix;
    qs$("#description").value = profile.description;

    qs$("#charset").replaceChildren();
    (Settings.CHARSET_OPTIONS).forEach((charset) => {
        qs$("#charset").append(new Option(charset));
    });
    qs$("#charset").append(new Option("Custom charset"));

    if ((Settings.CHARSET_OPTIONS).includes(profile.selectedCharset)) {
        qs$("#charset").value = profile.selectedCharset;
    } else {
        qs$("#charset").value = "Custom charset";
        qs$("#customCharset").value = profile.selectedCharset;
    }

    updateCustomCharsetField();
    updateExample();
    updateLeet();
    highlightProfile();
    // Keeps profile #1 around so it can only be re-named, always the default profile in all sorting orders
    if (Settings.profiles[0].id === profile.id) {
        qs$("#remove").style.display = "none";
    } else {
        qs$("#remove").style.display = "";
    }

    showSection("#profile_settings");
    oldHashWarning(profile.hashAlgorithm);
}

function updateCustomCharsetField() {
    if (qs$("#charset").value === "Custom charset") {
        qs$("#customCharset").value = Settings.getProfileById(Settings.currentProfile).selectedCharset;
        qs$("#customCharset").style.display = "";
    } else {
        qs$("#customCharset").style.display = "none";
    }
}

function oldHashWarning(hash) {
    // Be as annoying as possible to try and stop people from using the bugged algorithms
    var bugged = new Set(["md5_v6", "hmac-md5_v6", "hmac-sha256"]);
    if (bugged.has(hash)) {
        if (confirm("Are you sure you want to continue using a legacy algorithm which is incorrectly implemented?")) {
            alert(`Please change to using a correct & secure algorithm!
The old/bugged/legacy algorithms are harmful to your online security and should be avoided at ALL costs.
Please change your passwords on the sites which you are using this algorithm if you are able to as soon as possible!`);
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
    qs$("#exportText").value = RdfImporter.dumpDoc();
}

function importRdf() {
    var txt = qs$("#importText").value;

    if (txt.trim().length === 0) {
        alert("Import text is empty");
        return false;
    }

    var rdfDoc = RdfImporter.loadDoc(txt);
    // Check that profiles have been parsed and are available before wiping current data
    if (rdfDoc.profiles.length > 0 && qs$("#importOverwrite").checked) {
        Settings.profiles = [];
    }

    if (RdfImporter.saveProfiles(rdfDoc.profiles) === 0) {
        alert("Sorry, no profiles found");
        return false;
    }

    updateProfileList();
}

function copyRdfExport() {
    navigator.clipboard.writeText(qs$("#exportText").value)
        .then(() => qs$("#exportText").select());
}

function showOptions() {
    chrome.storage.sync.get().then((result) => {
        if (Object.keys(result).length > 0) {
            chrome.storage.local.set({ "syncDataAvailable": true });
        }
    }).catch((err) => console.trace(`Could not check sync data: ${err}`));

    chrome.storage.local.get(["storeLocation", "expire_password_minutes", "master_password_hash", "zoomLevel"])
        .then((result) => {
            qs$("#store_location").value = result["storeLocation"];
            qs$("#expirePasswordMinutes").value = (result["expire_password_minutes"] || 5);
            qs$("#zoomLevel").value = (result["zoomLevel"] || 100);
            updateStyle(qs$("#password_expire_row"), "hidden", (result["storeLocation"] !== "memory_expire"));
            updateStyle(qs$("#master_password_row"), "hidden", (result["master_password_hash"] === undefined));
            showSection("#general_settings");
        })
        .then(() => updateSyncStatus())
        .then(() => filterProfiles())
        .catch((err) => console.trace(`Could not run showOptions: ${err}`));
}

function showInformation() {
    showSection("#general_information");
}

function showSection(showId) {
    qs$("#checkStrength").checked = false;
    showStrengthSection();
    Array.from(qsa$("section"))
        .concat(Array.from(qsa$("aside")))
        .filter((el) => el.id !== showId)
        .forEach((el) => el.style.display = "none");
    qs$(showId).style.display = "block";
    shouldDragSort();
}

function highlightProfile() {
    qsa$(".highlight").forEach((el) => el.classList.remove("highlight"));
    qs$("#profile_" + Settings.currentProfile).classList.add("highlight");
}

function updateStorageLocation() {
    var storeLocation = qs$("#store_location").value;
    chrome.storage.local.set({ "storeLocation": storeLocation })
        .then(() => Settings.setStoreLocation(storeLocation))
        .then(() => updateStyle(qs$("#password_expire_row"), "hidden", (storeLocation !== "memory_expire")))
        .catch((err) => console.trace(`Could not run updateStorageLocation: ${err}`));
}

function saveProfile() {
    var selected = Settings.getProfileById(Settings.currentProfile);

    selected.title          = qs$("#profileNameTB").value.trim();
    selected.timestamp      = Date.now();
    selected.siteList       = qs$("#siteList").value.trim().split(/\s+/).join(" ");
    selected.url_protocol   = qs$("#protocolCB").checked;
    selected.url_subdomain  = qs$("#subdomainCB").checked;
    selected.url_domain     = qs$("#domainCB").checked;
    selected.url_path       = qs$("#pathCB").checked;
    selected.strUseText     = qs$("#inputUseThisText").value.trim();
    selected.whereToUseL33t = qs$("#whereLeetLB").value;
    selected.l33tLevel      = qs$("#leetLevelLB").value;
    selected.hashAlgorithm  = qs$("#hashAlgorithmLB").value;
    selected.passwordLength = qs$("#passwdLength").value;
    selected.username       = qs$("#usernameTB").value.trim();
    selected.modifier       = qs$("#modifier").value.trim();
    selected.passwordPrefix = qs$("#passwordPrefix").value;
    selected.passwordSuffix = qs$("#passwordSuffix").value;
    selected.description    = qs$("#description").value;

    // make sure default profile siteList and strUseText stays blank/generic
    if (Settings.profiles[0].id === selected.id) {
        selected.siteList = "";
        selected.strUseText = "";
    }

    if (qs$("#charset").value === "Custom charset") {
        selected.selectedCharset = qs$("#customCharset").value;
    } else {
        selected.selectedCharset = qs$("#charset").value;
    }

    Settings.saveProfiles()
        .then(() => updateProfileList())
        .then(() => {
            setCurrentProfile(selected);
            highlightProfile();
            oldHashWarning(selected.hashAlgorithm);
            updateShowRecentModTime();
        }).catch((err) => console.trace(`Could not run saveProfile: ${err}`));
}

function cloneProfile() {
    var p = Object.assign(new Profile(), Settings.getProfileById(Settings.currentProfile));
    p.title = p.title + " Copy";
    p.timestamp = Date.now();
    Settings.addProfile(p);
    updateProfileList().then(() => setCurrentProfile(p));
}

function handleDragStart(e) {
    e.target.classList.add("dragging");
}

function handleDragEnd() {
    let selectedTitle = Settings.getProfileById(Settings.currentProfile).title;
    let sortableList = qs$("#profile_list");
    let newList = [];
    sortableList.childNodes.forEach((el) => {
        newList.push(Settings.getProfileById(parseInt(el.lastChild.id.replace(/^\D+/, ""))))
    });
    Settings.profiles = newList;
    Settings.saveProfiles()
            .then(() => updateProfileList())
            .then(() => setCurrentProfile(Settings.getProfileByTitle(selectedTitle)));
}

function handleDragOver(e) {
    let sortableList = qs$("#profile_list");
    e.preventDefault();
    let draggedItem = qs$(".dragging");
    let siblings = Array.from(sortableList.querySelectorAll("li:not(:first-child):not(.dragging)"));
    let nextSibling = siblings.find((sibling) => {
        return e.pageY <= sibling.offsetTop + parseInt(sibling.offsetHeight / 2);
    });
    sortableList.insertBefore(draggedItem, nextSibling);
}

function handleDragEnter(e) {
    e.preventDefault();
}

function shouldDragSort() {
    return chrome.storage.local.get(["sort_profiles"]).then((result) => {
        if (result["sort_profiles"] !== "user_defined" || qs$("#searchProfiles").value.length !== 0) {
            disableDragSorting();
        } else {
            enableDragSorting();
        }
    });
}

function enableDragSorting() {
    let sortableList = qs$("#profile_list");
    sortableList.querySelectorAll("li:not(:first-child)").forEach((item) => {
        item.addEventListener("dragstart", handleDragStart);
        item.addEventListener("dragend", handleDragEnd);
    });
    sortableList.addEventListener("dragover", handleDragOver);
    sortableList.addEventListener("dragenter", handleDragEnter);
    qsa$(".grab").forEach((el) => el.style.display = "");
}

function disableDragSorting() {
    let sortableList = qs$("#profile_list");
    sortableList.querySelectorAll("li:not(:first-child)").forEach((item) => {
        item.removeEventListener("dragstart", handleDragStart);
        item.removeEventListener("dragend", handleDragEnd);
    });
    sortableList.removeEventListener("dragover", handleDragOver);
    sortableList.removeEventListener("dragenter", handleDragEnter);
    qsa$(".grab").forEach((el) => el.style.display = "none");
}

function editProfile(event) {
    if (event.target.classList.contains("link")) {
        var targetId = event.target.id.replace(/^\D+/, "");
        setCurrentProfile(Settings.getProfileById(targetId));
    }
}

function updateProfileList() {
    return chrome.storage.local.get(["sort_profiles"]).then((result) => {
        Settings.sortProfiles(result["sort_profiles"]);
        qs$("#profile_num").textContent = Settings.profiles.length.toString();

        var profileList = qs$("#profile_list");
        profileList.replaceChildren(); //Empty profile list
        Settings.profiles.forEach((profile, i) => {
            var listItem = document.createElement("li");
            var spanItem = document.createElement("span");
            spanItem.className = "link";
            spanItem.id = "profile_" + profile.id;
            spanItem.textContent = profile.title;
            if (i > 0) {
                var dragHandle = document.createElement("span");
                dragHandle.className = "grab";
                dragHandle.innerHTML = "&#x21F5;";
                dragHandle.title = "Click and Drag Profile";
                listItem.draggable = "true";
                listItem.append(dragHandle);
            }
            listItem.append(spanItem)
            profileList.append(listItem);
            if (profile.timestamp > Settings.lastmod) Settings.lastmod = profile.timestamp;
        });
    }).catch((err) => console.trace(`Could not run updateProfileList: ${err}`));
}

function syncSucccess(syncPassHash) {
    return Settings.saveSyncedProfiles(syncPassHash, Settings.encrypt(syncPassHash, JSON.stringify(Settings.profiles)))
        .then(() => chrome.storage.local.set({ "sync_profiles": true, "sync_profiles_password": syncPassHash }))
        .then(() => updateProfileList())
        .then(() => {
            qs$("#syncProfilesPassword").value = "";
            updateSyncStatus();
        }).catch((err) => console.trace(`Could not run syncSucccess: ${err}`));
}

function setSyncPassword() {
    var syncPassValue = qs$("#syncProfilesPassword").value.trim();
    if (syncPassValue.length === 0) {
        alert("Please enter a password to enable sync");
        return;
    }

    return chrome.storage.local.get(["syncDataAvailable", "synced_profiles"]).then((result) => {
        var syncPassHash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(syncPassValue));
        
        if (result["syncDataAvailable"] === true) {
            if (result["synced_profiles"]) {
                var profiles = Settings.decrypt(syncPassHash, result["synced_profiles"]);
                if (profiles.length !== 0) {
                    Settings.loadProfilesFromString(profiles);
                    syncSucccess(syncPassHash);
                } else {
                    alert("Wrong password! Please specify the password you used when initially synced your data.");
                }
            }
        } else {
            syncSucccess(syncPassHash);
        }
    }).catch((err) => console.trace(`Could not run setSyncPassword: ${err}`));
}

function clearSyncData() {
    chrome.storage.sync.clear()
        .then(() => chrome.storage.local.remove(["syncDataAvailable", "sync_profiles", "synced_profiles", "synced_profiles_keys", "sync_profiles_password"]))
        .then(() => Settings.loadProfiles())
        .then(() => updateProfileList())
        .then(() => updateSyncStatus())
        .catch((err) => console.trace(`Could not run clearSyncData: ${err}`));
}

function updateSyncStatus() {
    qsa$("#sync_profiles_row, #no_sync_password, #sync_data_exists, #sync_password_set").forEach((el) => el.style.display = "none");
    qsa$("#set_sync_password, #clear_sync_data").forEach((el) => el.classList.add("hidden"));

    if (qs$("#syncProfiles").checked) {
        return chrome.storage.local.get(["syncDataAvailable", "sync_profiles_password", "synced_profiles"]).then((result) => {
            var syncHash = result["sync_profiles_password"] || "";
            var profiles = Settings.decrypt(syncHash, result["synced_profiles"]);
            if (profiles.length !== 0) {
                qs$("#sync_password_set").style.display = "";
                qs$("#clear_sync_data").classList.remove("hidden");
            } else if (result["syncDataAvailable"]) {
                qsa$("#sync_profiles_row, #sync_data_exists").forEach((el) => el.style.display = "");
                qsa$("#set_sync_password, #clear_sync_data").forEach((el) => el.classList.remove("hidden"));
            } else {
                qsa$("#sync_profiles_row, #no_sync_password").forEach((el) => el.style.display = "");
                qs$("#set_sync_password").classList.remove("hidden");
            }
        }).catch((err) => console.trace(`Could not enable updateSyncStatus: ${err}`));
    } else {
        return chrome.storage.local.remove(["sync_profiles", "sync_profiles_password"])
            .then(() => Settings.loadProfiles())
            .then(() => updateProfileList())
            .catch((err) => console.trace(`Could not disable updateSyncStatus: ${err}`));
    }
}

function updateMasterHash() {
    if (qs$("#keepMasterPasswordHash").checked) {
        qs$("#master_password_row").classList.remove("hidden");
        var master_pass = qs$("#masterPassword").value;
        if (master_pass.length > 0) {
            chrome.storage.local.set({ "master_password_hash": JSON.stringify(Settings.make_pbkdf2(master_pass)) });
        } else {
            chrome.storage.local.remove("master_password_hash");
        }
    } else {
        qs$("#master_password_row").classList.add("hidden");
        qs$("#masterPassword").value = "";
        chrome.storage.local.remove("master_password_hash");
    }
}

function updateHidePassword() {
    if (qs$("#hidePassword").checked) {
        chrome.storage.local.set({ "hide_generated_password": true });
    } else {
        chrome.storage.local.remove("hide_generated_password");
    }
}

function updateUseVerificationCode() {
    if (qs$("#useVerificationCode").checked) {
        chrome.storage.local.set({ "use_verification_code": true });
    } else {
        chrome.storage.local.remove("use_verification_code");
    }
}

function updateShowStrength() {
    if (qs$("#showPasswordStrength").checked) {
        chrome.storage.local.set({ "show_password_strength": true });
    } else {
        chrome.storage.local.remove("show_password_strength");
    }
}

function updateShowRecentModTime() {
    if (qs$("#showRecentModTime").checked) {
        chrome.storage.local.set({ "show_recent_mod_time": true }).then(() => {
            qs$("#profile_list_last_mod").innerHTML = `<h4>Last Modified On ${formatLastModTime(Settings.lastmod)}</h4>`;
        });
    } else {
        chrome.storage.local.remove("show_recent_mod_time").then(() => {
            qs$("#profile_list_last_mod").innerHTML = "";
        });
    }
}

function updateSortProfiles() {
    chrome.storage.local.set({ "sort_profiles": qs$("#sort_profiles").value })
        .then(() => Settings.loadProfiles())
        .then(() => updateProfileList())
        .then(() => filterProfiles())
        .catch((err) => console.trace(`Could not run updateSortProfiles: ${err}`));
}

function sanitizePasswordLength() {
    var field = qs$("#passwdLength");
    if (field.value < 4) field.value = "4";
    if (field.value > 512) field.value = "512";
}

function sanitizeExpireTime(newExpireTime) {
    var field = qs$("#expirePasswordMinutes");
    if (newExpireTime < 1) {
        newExpireTime = 1;
        field.value = "1";
    }
    if (newExpireTime > 720) {
        newExpireTime = 720;
        field.value = "720";
    }
    newExpireTime = parseInt(newExpireTime);
    field.value = newExpireTime;
    return newExpireTime;
}

function updateExpireTime() {
    chrome.storage.local.get(["expire_password_minutes", "storeLocation"]).then((result) => {
        var oldExpireTime = result["expire_password_minutes"] || 5;
        var newExpireTime = qs$("#expirePasswordMinutes").value;
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
    }).catch((err) => console.trace(`Could not run updateExpireTime: ${err}`));
}

function sanitizeZoomLevel(newZoomLevel) {
    var field = qs$("#zoomLevel");
    if (newZoomLevel < 100) {
        newZoomLevel = 100;
        field.value = "100";
    }
    if (newZoomLevel > 210) {
        newZoomLevel = 210;
        field.value = "210";
    }
    newZoomLevel = parseInt(newZoomLevel);
    field.value = newZoomLevel;
    return newZoomLevel;
}

function updateZoomLevel() {
    chrome.storage.local.get(["zoomLevel"]).then((result) => {
        var oldZoomLevel = result["zoomLevel"] || 100;
        var newZoomLevel = qs$("#zoomLevel").value;
        newZoomLevel = sanitizeZoomLevel(newZoomLevel);
        if (oldZoomLevel !== newZoomLevel) {
            chrome.storage.local.set({ "zoomLevel": newZoomLevel });
        }
    }).catch((err) => console.trace(`Could not run updateZoomLevel: ${err}`));
}

function fileImport() {
    var file = qs$("#fileInput").files[0];
    if ((/rdf|xml/i).test(file.type)) {
        var reader = new FileReader();
        reader.onload = () => {
            qs$("#importText").value = reader.result;
        };
        reader.readAsText(file);
    } else {
        qs$("#importText").value = "Please select an RDF or XML file containing PasswordMaker profile data.";
    }
}

function fileExport() {
    var textFileAsBlob = new Blob([qs$("#exportText").value], {
        type: "application/rdf+xml"
    });
    var downloadLink = document.createElement("a");
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.download = "PasswordMaker.org Profile Data.rdf";
    downloadLink.click();
}

function showStrengthSection() {
    if (qs$("#checkStrength").checked) {
        qs$("#strength_section").style.display = "inline-block";
        qsa$(".testInput").forEach((el) => el.addEventListener("input", checkPassStrength));
        checkPassStrength();
    } else {
        qs$("#strength_section").style.display = "none";
        qsa$(".testInput").forEach((el) => el.removeEventListener("input", checkPassStrength));
        qsa$(".strengthInput").forEach((el) => el.value = "");
    }
}

function filterProfiles() {
    var filter = qs$("#searchProfiles").value.toUpperCase();
    // Loop through all list items, and hide those which don't match the search query
    Array.from(qsa$("#profile_list li")).forEach((item) => {
        var itemId = item.lastChild.id.replace(/^\D+/, "");
        var prof = Settings.getProfileById(itemId);
        if (prof.title.toUpperCase().includes(filter) || prof.strUseText.toUpperCase().includes(filter) ||
            prof.username.toUpperCase().includes(filter) || prof.description.toUpperCase().includes(filter) ||
            prof.siteList.toUpperCase().includes(filter)) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
    if (filter.length === 0) {
        shouldDragSort();
    } else {
        disableDragSorting();
    }
}

function checkPassStrength() {
    var selected = Settings.getProfileById(Settings.currentProfile);

    selected.siteList       = qs$("#siteList").value.trim().replace(/[*?$+()^[\]\\|{},]/g, "").split(/\s+/).shift();
    selected.url_protocol   = qs$("#protocolCB").checked;
    selected.url_subdomain  = qs$("#subdomainCB").checked;
    selected.url_domain     = qs$("#domainCB").checked;
    selected.url_path       = qs$("#pathCB").checked;
    selected.strUseText     = qs$("#inputUseThisText").value.trim();
    selected.whereToUseL33t = qs$("#whereLeetLB").value;
    selected.l33tLevel      = qs$("#leetLevelLB").value;
    selected.hashAlgorithm  = qs$("#hashAlgorithmLB").value;
    selected.passwordLength = qs$("#passwdLength").value;
    selected.username       = qs$("#usernameTB").value.trim();
    selected.modifier       = qs$("#modifier").value.trim();
    selected.passwordPrefix = qs$("#passwordPrefix").value;
    selected.passwordSuffix = qs$("#passwordSuffix").value;

    if (qs$("#charset").value === "Custom charset") {
        selected.selectedCharset = qs$("#customCharset").value;
    } else {
        selected.selectedCharset = qs$("#charset").value;
    }

    if (selected.strUseText.length !== 0) {
        qs$("#testText").value = selected.strUseText;
    } else {
        qs$("#testText").value = selected.getUrl(selected.siteList);
    }

    qs$("#genPass").value = selected.genPassword(qs$("#testText").value, qs$("#testPass").value, selected.username);
    var values = Settings.getPasswordStrength(qs$("#genPass").value);
    qsa$("#genStrength, #optionsMeter").forEach((el) => el.value = values.strength);
    qs$("#hasUpper").checked = values.hasUpper;
    qs$("#hasLower").checked = values.hasLower;
    qs$("#hasDigit").checked = values.hasDigit;
    qs$("#hasSymbol").checked = values.hasSymbol;
}

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["storeLocation"]).then((result) => {
        if (result["storeLocation"] === undefined) {
            chrome.storage.local.set({ "storeLocation": "memory" });
        }
        Settings.migrateStorage()
        .then(() => Settings.loadProfiles()).catch((err) => console.trace(`Failure during options Settings.loadProfiles: ${err}`))
        .then(() => updateProfileList()).catch((err) => console.trace(`Failure during updateProfileList: ${err}`))
        .then(() => setCurrentProfile(Settings.profiles[0])).catch((err) => console.trace(`Failure during options setCurrentProfile: ${err}`))
        .then(() => {
            chrome.storage.local.get(["hide_generated_password", "sync_profiles", "master_password_hash", "use_verification_code", "show_password_strength", "show_recent_mod_time", "sort_profiles"]).then((result) => {
                qs$("#hidePassword").checked = result["hide_generated_password"];
                qs$("#keepMasterPasswordHash").checked = result["master_password_hash"];
                qs$("#useVerificationCode").checked = result["use_verification_code"];
                qs$("#showPasswordStrength").checked = result["show_password_strength"];
                qs$("#syncProfiles").checked = result["sync_profiles"];
                qs$("#sort_profiles").value = result["sort_profiles"];
                if (result["show_recent_mod_time"]) {
                    qs$("#showRecentModTime").checked = result["show_recent_mod_time"];
                    qs$("#profile_list_last_mod").innerHTML = `<h4>Last Modified On ${formatLastModTime(Settings.lastmod)}</h4>`;
                }
            });

            qs$("#profile_list").addEventListener("click", editProfile);
            qs$("#add").addEventListener("click", addProfile);
            qs$("#showImport").addEventListener("click", showImport);
            qs$("#showExport").addEventListener("click", showExport);
            qs$("#showSettings").addEventListener("click", showOptions);
            qs$("#showInformation").addEventListener("click", showInformation);

            qs$("#protocolCB").addEventListener("change", updateExample);
            qs$("#subdomainCB").addEventListener("change", updateExample);
            qs$("#domainCB").addEventListener("change", updateExample);
            qs$("#pathCB").addEventListener("change", updateExample);
            qs$("#whereLeetLB").addEventListener("change", updateLeet);
            qs$("#charset").addEventListener("change", updateCustomCharsetField);
            qs$("#passwdLength").addEventListener("change", sanitizePasswordLength);

            qs$("#cloneProfileButton").addEventListener("click", cloneProfile);
            qs$("#checkStrength").addEventListener("change", showStrengthSection);
            qs$("#remove").addEventListener("click", removeProfile);
            qs$("#save").addEventListener("click", saveProfile);
            qs$("#importButton").addEventListener("click", importRdf);
            qs$("#fileInput").addEventListener("change", fileImport);
            qs$("#copyButton").addEventListener("click", copyRdfExport);
            qs$("#exportFileButton").addEventListener("click", fileExport);

            qs$("#zoomLevel").addEventListener("change", updateZoomLevel);
            qs$("#store_location").addEventListener("change", updateStorageLocation);
            qs$("#expirePasswordMinutes").addEventListener("change", updateExpireTime);
            qs$("#hidePassword").addEventListener("change", updateHidePassword);
            qs$("#keepMasterPasswordHash").addEventListener("change", updateMasterHash);
            qs$("#syncProfiles").addEventListener("change", updateSyncStatus);
            qs$("#masterPassword").addEventListener("input", updateMasterHash);
            qs$("#useVerificationCode").addEventListener("change", updateUseVerificationCode);
            qs$("#showPasswordStrength").addEventListener("change", updateShowStrength);
            qs$("#showRecentModTime").addEventListener("change", updateShowRecentModTime);
            qs$("#sort_profiles").addEventListener("change", updateSortProfiles);
            qs$("#set_sync_password").addEventListener("click", setSyncPassword);
            qs$("#syncProfilesPassword").addEventListener("input", (event) => {
                if (event.code === "Enter") setSyncPassword();
            })
            qs$("#clear_sync_data").addEventListener("click", clearSyncData);
            qs$("#resetToDefaultprofiles").addEventListener("click", removeAllProfiles);
            qs$("#searchProfiles").addEventListener("input", filterProfiles);
        }).catch((err) => console.trace(`Failure during options page load: ${err}`));
    });
});
