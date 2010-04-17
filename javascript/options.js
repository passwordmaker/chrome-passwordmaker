function editProfile(id) {
}

function updateStyle(element, selected, isSelected) {
    if (isSelected) {
        element.addClass(selected);
    } else {
        element.removeClass(selected);
    }
}

function updateExample() {
    updateStyle($("#exprotocol"), "selected", $("#protocolCB").is(":checked"));
    updateStyle($("#exsubdomain"), "selected", $("#subdomainCB").is(":checked"));
    updateStyle($("#exdomain"), "selected", $("#domainCB").is(":checked"));
    updateStyle($("#expath"), "selected", $("#pathCB").is(":checked"));
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