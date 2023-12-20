function updateSyncedProfiles(data) {
    if (data["synced_profiles"] !== undefined) {
        chrome.storage.local.set({ "synced_profiles": data["synced_profiles"]["newValue"] });
    } else if (data["synced_profiles_keys"] !== undefined) {
        var profiles = "";
        data.synced_profiles_keys.newValue.forEach(key => {
            profiles += data[key].newValue;
        });
        chrome.storage.local.set({ "synced_profiles_keys": data["synced_profiles_keys"]["newValue"].join() });
    }
    if (data["sync_profiles_password"] !== undefined && data["sync_profiles_password"]["newValue"] !== undefined) {
        chrome.storage.local.set({ "sync_profiles_password": data["sync_profiles_password"]["newValue"] });
    }
}

chrome.storage.sync.get().then(data => {
    updateSyncedProfiles(data)
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== "sync") {
        return;
    }
    if (changes["synced_profiles"] !== undefined) {
        updateSyncedProfiles(changes);
    }
    if (changes["sync_profiles_password"] && changes["sync_profiles_password"]["newValue"]) {
        chrome.storage.local.set({ "sync_profiles_password": changes["sync_profiles_password"]["newValue"] });
    }
});

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "expire_password") {
        chrome.storage.session.set({ "password": "" });
    }
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(["store_location"]).then((result) => {
        if ((/memory/i).test(result.store_location)) {
            chrome.storage.session.set({ "password": "" });
        }
    })
});
