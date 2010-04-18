var Settings = {
    activeProfileId : localStorage["profile_id"],
    storeLocation: localStorage["store_location"],
    password: "",
    profiles: null
};

Settings.getProfiles = function() {
    if (Settings.profiles == null) {
        Settings.loadProfiles();
    }
    
    return Settings.profiles;
}

Settings.getProfile = function(id) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        if (profiles[i].id == id) {
            return profiles[i];
        }
    }
    return null;
}

Settings.getMaxId = function() {
    var maxId = 0;
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        if (profiles[i].id > maxId) {
            maxId = profiles[i].id;
        }
    }
    return maxId;
}

Settings.addProfile = function(profile) {
    if (Settings.profiles == null) {
        Settings.getProfiles();
    }
    
    profile.id = Settings.getMaxId() + 1;
    
    Settings.profiles.push(profile);
}

Settings.deleteProfile = function(profile) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        if (profiles[i].id == profile.id) {
            profiles.splice(i, 1);
            Settings.saveProfiles();
        }
    }
}

Settings.loadProfiles = function() {
    if (localStorage["profiles"] == null || localStorage["profiles"] == "") {
        Settings.profiles = [new Profile()];
    } else {
        try {
            json = JSON.parse(localStorage["profiles"]);

            Settings.profiles = [];
            $.each(json, function(i) {
                p = new Profile();
                $.each(json[i], function(key, value) {
                    p[key] = value; 
                });
                Settings.profiles.push(p);                
            });
        } catch(e) {
            Settings.profiles = [new Profile()];
        }
    }
}

Settings.saveProfiles = function() {
    localStorage["profiles"] = JSON.stringify(Settings.profiles);
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