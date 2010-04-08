var currentTab = null;

function updateFields() {
    console.log("Yeaaaah!");
    
    var password = $("#password").val();
    var confirmation = $("#confirmation").val();
    
    console.log(password);
    console.log(confirmation);
    
    if (password != confirmation) {
        $("#generated").val("");
        $("#generated").css("background-color", "#FF7272");
        $("#generated").css("color", "#FFFFFF");        
        $("#password").css("background-color", "#FF7272");
        $("#password").css("color", "#FFFFFF");        
        $("#confirmation").css("background-color", "#FF7272");
        $("#confirmation").css("color", "#FFFFFF");        
    } else {
        $("#generated").css("background-color", "#FFFFFF");
        $("#generated").css("color", "#000000");        
        $("#password").css("background-color", "#FFFFFF");
        $("#password").css("color", "#000000");        
        $("#confirmation").css("background-color", "#FFFFFF");
        $("#confirmation").css("color", "#000000");        
    }
    
    
}

function fillPassword() {
    chrome.tabs.sendRequest(currentTab, {password: $("#generated").val()});
    window.close();
}

$(function() {
    $("#injectpasswordrow").hide();

    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.getSelected(obj.id, function(tab) {
            $("#usedtext").val(tab.url);
            currentTab = tab.id;
            chrome.extension.sendRequest({hasPasswordField: true, tabId: tab.id}, function(response) {
                if (response.hasField) {
                    $("#injectpasswordrow").show();
                    $("body").css("height", "270px");
                }
            });
        });

    });
    
    updateFields();
    $("#generated").focus(); 
});