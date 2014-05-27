chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.password) {
        fillPasswords(request.password);
    }
    if (request.hasPasswordField) {
        if (hasPassField()) {
            sendResponse({hasField: true});
        }
    }
});

function fillPasswords(password) {
    var fields = document.querySelectorAll("input[type=password]");
    for (var i = 0; i < fields.length; i++) {
        // Only fill password fields that are empty and aren't already populated (for change password pages)
        if (fields[i].value.length === 0) {
            fields[i].value = password;
        }
    }
}

function hasPassField() {
    var hasFields = false;
    if (document.querySelector("input[type=password]") !== null) {
        hasFields = true;
    }
    return hasFields;
}
