function updateSyncedProfiles(data) {
    chrome.storage.local.set({"synced_profiles_keys": ""});
    if (!data.synced_profiles) {
        data.synced_profiles = "";
    } else if (typeof(data.synced_profiles) !== "string") {
        var profiles = "";
        data.synced_profiles.forEach(function(key) {
            profiles += data[key];
        });
        chrome.storage.local.set({"synced_profiles_keys": data.synced_profiles.join()});
        data.synced_profiles = profiles;
    }
    chrome.storage.local.set({"synced_profiles": data.synced_profiles});
}

chrome.storage.sync.get(null).then((data) => {
    if (!chrome.runtime.lastError) {
        updateSyncedProfiles(data);
        if (data.sync_profiles_password) {
            chrome.storage.local.set({"sync_profiles_password": data.sync_profiles_password});
        }
    }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== "sync") {
        return;
    }
    if (!changes.synced_profiles) {
        var flattened = {};
        Object.keys(changes).forEach(function(key) {
            flattened[key] = changes[key];
        });
        updateSyncedProfiles(flattened);
    }
    if (!changes.sync_profiles_password) {
        chrome.storage.local.set({"sync_profiles_password": (changes.sync_profiles_password || "")});
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "expire_password") {
        chrome.storage.local.set({ "password": "" });
    }
});

chrome.runtime.onStartup.addListener(function() {
    chrome.storage.local.get(["store_location"]).then((result) => {
        if (/memory/.test(result.store_location)) {
            chrome.storage.local.set({ password: "" });
        }
    })
});
