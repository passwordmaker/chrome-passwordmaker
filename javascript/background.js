var password = null;

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    response = {};

    if (request.setPassword) {
        password = request.password
    } else if (request.getPassword) {
        response = {password: password}
    }
    sendResponse(response);
});

function updateSyncedProfiles(data) {
    localStorage["synced_profiles_keys"] = "";
    if (data.synced_profiles == undefined) {
      data.synced_profiles = "";
    } else if (typeof(data.synced_profiles) != "string") {
      profiles = "";
      for (i in data.synced_profiles) {
        profiles = profiles + data[data.synced_profiles[i]];
      }
      localStorage["synced_profiles_keys"] = data.synced_profiles.join();
      data.synced_profiles = profiles;
    }
    localStorage["synced_profiles"] = data.synced_profiles;
}

chrome.storage.sync.get(null, function(data) {
    if (chrome.extension.lastError == undefined) {
        updateSyncedProfiles(data);
    }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace != "sync") {
        return;
    }
    if (changes.synced_profiles != undefined) {
        var flattened = {};
        for (i in changes) {
          flattened[i] = changes[i].newValue;
        }
        updateSyncedProfiles(flattened);
    }
});
