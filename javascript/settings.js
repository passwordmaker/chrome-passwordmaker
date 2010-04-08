var Settings = {};

Settings.getProfiles = function() {
    return [new Profile()];
}

Settings.getProfile = function(id) {
    console.log("Get id : ");
    console.log(id);
    var profiles = Settings.getProfiles();
    
    for (var i in profiles) {
        if (profiles[i].getId() == id) {
            return profiles[i];
        }
    }
    console.log("not found");
    return null;
}