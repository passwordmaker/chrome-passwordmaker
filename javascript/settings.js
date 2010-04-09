var Settings = {};

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