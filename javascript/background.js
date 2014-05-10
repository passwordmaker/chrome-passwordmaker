var password = "";
var currentTab = "";

function updateSyncedProfiles(data) {
    localStorage["synced_profiles_keys"] = "";
    if (data.synced_profiles === undefined) {
        data.synced_profiles = "";
    } else if (typeof (data.synced_profiles) !== "string") {
        profiles = "";
        for (var i in data.synced_profiles) {
            profiles = profiles + data[data.synced_profiles[i]];
        }
        localStorage["synced_profiles_keys"] = data.synced_profiles.join();
        data.synced_profiles = profiles;
    }
    localStorage["synced_profiles"] = data.synced_profiles;
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace !== "sync") {
        return;
    }
    if (changes.synced_profiles !== undefined) {
        var flattened = {};
        for (var i in changes) {
            flattened[i] = changes[i].newValue;
        }
        updateSyncedProfiles(flattened);
    }
});
