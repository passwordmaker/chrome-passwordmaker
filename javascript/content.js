chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.password) {
        fillPasswords(request.password);
    } else if (request.hasPasswordField) {
      if (hasPasswordField()) {
        sendResponse({hasField: true});
      }
    }
});

function fillPasswords(password) {
    var passFields = document.querySelectorAll("input[type='password']");
    [].forEach.call(passFields, function (element, index) {
        // Only fill password fields that are empty and aren't already populated (for change password pages)
        if (passFields[index].value.length === 0) {
            passFields[index].value = password;
        }
    });
}

function hasPasswordField() {
    var hasFields = false;
    if (document.querySelector("input[type='password']") !== null) {
        hasFields = true;
    }
    return hasFields;
}
