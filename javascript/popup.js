var currentTab = null;

function setPasswordColors(foreground, background) {
    $("#generated").css("background-color", background);
    $("#generated").css("color", foreground);        
    $("#password").css("background-color", background);
    $("#password").css("color", foreground);        
    $("#confirmation").css("background-color", background);
    $("#confirmation").css("color", foreground);        
}

function updateFields() {
    var password = $("#password").val();
    var confirmation = $("#confirmation").val();
    var profile = Settings.getProfile($("#profile").val());

    if (password == "") {
        $("#generated").val("Enter password");
        setPasswordColors("#000000", "#85FFAB")
    } else if (password != confirmation) {
        $("#generated").val("Password wrong");
        setPasswordColors("#FFFFFF", "#FF7272")
    } else {        
        if (profile != null) {
            $("#generated").val(profile.getPassword($("#usedtext").val(), password));
        } else {
            $("#generated").val("");
        }
        setPasswordColors("#000000", "#FFFFFF")
    }

}

function init() {
    var profiles = Settings.getProfiles();
    
    var options = "";
    for (var i in profiles) {
        var profile = profiles[i];
        options += "<option value='"+profile.getId()+"'>"+profile.getName()+"</option>";
    }

    $("#profile").empty().append(options);

    updateFields();
}

function fillPassword() {
    chrome.tabs.sendRequest(currentTab, {password: $("#generated").val()});
    window.close();
}

$(function() {
    $("#injectpasswordrow").hide();

    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.getSelected(obj.id, function(tab) {
            currentTab = tab.id;
            var profile = Settings.getProfile($("#profile").val());
            $("#usedtext").val(profile.getUrl(tab.url));
            updateFields();
            chrome.extension.sendRequest({hasPasswordField: true, tabId: tab.id}, function(response) {
                if (response.hasField) {
                    $("#injectpasswordrow").show();
                    $("body").css("height", "270px");
                }
            });
        });

    });
    
    init();
    $("#generated").focus(); 
});