var password = null;

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    response = {};

    if (request.setPassword) {
        password = request.password
    } else if (request.getPassword) {
        response = {password: password}
    }
    sendResponse(response);
});
