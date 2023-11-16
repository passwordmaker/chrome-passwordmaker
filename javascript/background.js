function updateSyncedProfiles(data) {
    chrome.storage.local.set({"synced_profiles_keys": ""});
    if (typeof data.synced_profiles !== "undefined") {
        data.synced_profiles = "";
    } else if (typeof data.synced_profiles_keys !== "undefined") {
        var profiles = "";
        data.synced_profiles_keys.newValue.forEach(key => {
            profiles += data[key].newValue;
        });
        chrome.storage.local.set({"synced_profiles_keys": data.synced_profiles_keys.newValue.join()});
        data.synced_profiles = profiles;
    }
    chrome.storage.local.set({"synced_profiles": data.synced_profiles});
}

chrome.storage.sync.get().then(data => {
    if (typeof chrome.runtime.lastError !== "undefined") {
        updateSyncedProfiles(data);
        if (data.sync_profiles_password) {
            chrome.storage.local.set({"sync_profiles_password": data.sync_profiles_password});
        }
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== "sync") {
        return;
    }
    if (typeof changes.synced_profiles !== "undefined") {
        updateSyncedProfiles(changes);
    } else if (typeof changes.synced_profiles_keys !== "undefined") {
        updateSyncedProfiles(changes);
    }
    if (typeof changes.sync_profiles_password !== "undefined") {
        chrome.storage.local.set({"sync_profiles_password": (changes.sync_profiles_password.newValue || "")});
    }
});

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "expire_password") {
        chrome.storage.local.set({ "password": "" });
    }
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["store_location"]).then((result) => {
        if ((/memory/i).test(result.store_location)) {
            chrome.storage.local.set({ password: "" });
        }
    })
});
