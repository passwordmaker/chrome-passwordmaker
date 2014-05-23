chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.password) {
        fillPasswords(request.password);
    }
    if (request.hasPasswordField) {
        if (hasPassFields()) {
          sendResponse({hasField: true});
        }
    }
});

function fillPasswords(password) {
    jQuery("input[type=password]").val(password);
    alert("Passwords should now be filled");
}

function hasPassFields() {
    var fields = jQuery("input[type=password]");
    hasFields = false;
    if (fields.length > 0) {
        hasFields = true;
    }
    return hasFields;
}
