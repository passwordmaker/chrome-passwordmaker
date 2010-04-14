function editProfile(id) {
}

$(function() {
    var profiles = Settings.getProfiles();
    var list = "";
    
    for (var i in profiles) {
        var profile = profiles[i];
        list += "<li><a href='#' onClick='editProfile("+profile.getId()+")'>"+profile.getName()+"</a></li>";
    }
    
    $("#profile_list").empty().append(list);
        
});