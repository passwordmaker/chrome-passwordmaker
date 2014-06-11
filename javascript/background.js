var password = "";

function updateSyncedProfiles(data) {
    localStorage["synced_profiles_keys"] = "";
    if (data.synced_profiles === undefined) {
        data.synced_profiles = "";
    } else if (typeof (data.synced_profiles) !== "string") {
        var profiles = "";
        for (var i = 0; i < data.synced_profiles.length; i++) {
            profiles = profiles + data[data.synced_profiles[i]];
        }
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
        for (var i = 0; i < changes.length; i++) {
            flattened[i] = changes[i].newValue;
        }
        updateSyncedProfiles(flattened);
    }
});
