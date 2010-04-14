chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.password) {
        fillPasswords(request.password);
    } else if (request.hasPasswordField) {
        sendResponse({hasField: hasPasswordField()});
    }
});

function fillPasswords(password) {
    jQuery("input[type=password]").val(password);
}

function hasPasswordField() {
  fields = jQuery("input[type=password]");
  
  hasFields = false;
  
  if (fields && fields.length > 0) {
      hasFields = true;
  }
  
  return hasFields;
}