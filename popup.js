var currentTab = null;

function updateFields() {
    console.log("Yeaaaah!");
    // Change and store in Background
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

    $("#generated").focus(); 
});