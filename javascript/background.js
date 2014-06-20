var password = "";

function updateSyncedProfiles(data) {
    localStorage["synced_profiles_keys"] = "";
    if (data.synced_profiles === undefined) {
        data.synced_profiles = "";
    } else if (typeof (data.synced_profiles) !== "string") {
        var profiles = "";
        data.synced_profiles.forEach(function(key) {
            profiles += data[key];
        });
        localStorage["synced_profiles_keys"] = data.synced_profiles.join();
        data.synced_profiles = profiles;
    }
    localStorage["synced_profiles"] = data.synced_profiles;
}

chrome.storage.sync.get(null, function(data) {
    if (chrome.runtime.lastError === undefined) {
        updateSyncedProfiles(data);
    }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== "sync") {
        return;
    }
    if (changes.synced_profiles !== undefined) {
        var flattened = {};
        Object.keys(changes).forEach(function(key) {
            flattened[key] = changes[key].newValue;
        });
        updateSyncedProfiles(flattened);
    }
});
