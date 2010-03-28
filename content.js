chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  fillPasswords(request.password);
});

function fillPasswords(password) {
    jQuery("input[type=password]").val(password);
}

function findPasswordFields() {
  fields = jQuery("input[type=password]");
  
  hasFields = false;
  
  if (fields && fields.length > 0) {
      hasFields = true;
  }
  
  chrome.extension.sendRequest({setPasswordFieldAvailable: hasFields});
}

if (window == top) {
  findPasswordFields();
}