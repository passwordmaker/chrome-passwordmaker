var Settings = {
    activeProfileId : localStorage["profile_id"],
    storeLocation: localStorage["store_location"],
    password: ""
};

Settings.getProfiles = function() {
    return [new Profile()];
}

Settings.getProfile = function(id) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        if (profiles[i].getId() == id) {
            return profiles[i];
        }
    }
    return null;
}

Settings.getActiveProfileId = function() {
    return Settings.activeProfileId;
}

Settings.setActiveProfileId = function(id) {
    localStorage["profile_id"] = id;
    Settings.activeProfileId = id;
}

Settings.setStoreLocation = function(store) {
    if (Settings.storeLocation != store) {
        Settings.storeLocation = store;
        localStorage["store_location"] = store;
        if (Settings.storeLocation != "disk") {
            localStorage["password"] = "";
        }
        if (Settings.storeLocation != "memory") {
            Settings.password = "";
        }
    }
}

Settings.setPassword = function(password) {
    // ToDo: CRYPT THIS!!
    if (Settings.storeLocation == "memory") {
        Settings.password = password;
        localStorage["password"] = "";
        chrome.extension.sendRequest({setPassword: true, password: password});
    } else if (Settings.storeLocation == "disk") {
        Settings.password = password;
        localStorage["password"] = password;
        chrome.extension.sendRequest({setPassword: true, password: password});
    } else {
        Settings.password = null;
        localStorage["password"] = "";
        chrome.extension.sendRequest({setPassword: true, password: null});
    }
}

Settings.getPassword = function(callback) {
    if (Settings.password != null && Settings.password.length > 0) {
        callback(Settings.password);
    } else {
        chrome.extension.sendRequest({getPassword: true}, function(response) {
            if (response.password != null && response.password.length > 0) {
                callback(response.password);
            } else if (localStorage["password"]) {
                Settings.password = localStorage["password"];
                callback(Settings.password);
            } else {
                callback(null);
            }

        });
        
    }
}