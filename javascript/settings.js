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

// Make a pseudo-random encryption key... emphasis on *pseudo*
Settings.makeKey = function() {
  var hex = ['0','1','2','3','4','5','6','7','8','9','0','a','b','c','d','e','f'];
  var keySz = keySizeInBits/4; //keySizeInBits defined in aes.js
  var ret = "";
  while (ret.length < keySz) 
    ret += hex[Math.floor(Math.random()*15)];
  return ret;
}

Settings.setPassword = function(password) {
    // ToDo: CRYPT THIS!!
    if (Settings.storeLocation == "memory") {
        Settings.password = password;
        localStorage["password"] = "";
        chrome.extension.sendRequest({setPassword: true, password: password});
    } else if (Settings.storeLocation == "disk") {
        Settings.password = password;
        key = Settings.makeKey();        
        localStorage["password_key"] = key;
        localStorage["password_crypt"] = byteArrayToHex(rijndaelEncrypt(password, hexToByteArray(key), "CBC"));
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
            } else if (localStorage["password_crypt"]) {
                Settings.password = byteArrayToString(rijndaelDecrypt(hexToByteArray(localStorage["password_crypt"]), hexToByteArray(localStorage["password_key"]), "CBC"));
                callback(Settings.password)
            } else if (localStorage["password"]) {
                Settings.password = localStorage["password"];
                Settings.setPassword(Settings.password);
                localStorage["password"] = null;
                callback(Settings.password);
            } else {
                callback(null);
            }

        });
    }
}

Settings.setHidePassword = function(bool) {
    localStorage["show_generated_password"] = bool;
}

Settings.shouldHidePassword = function() {
    bool = localStorage["show_generated_password"];
    return bool == "true";
}