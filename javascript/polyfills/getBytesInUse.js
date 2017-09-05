/*!
 *  (chrome|browser).storage.sync.getBytesInUse Firefox polyfill by Brian Kieffer (kiefferbp)
 *  License - MIT
 */

(function () {
    "use strict";

    if (!Object.hasOwnProperty.call(window, "browser") || !Object.hasOwnProperty.call(window, "chrome")) {
        return;
    }

    if (!chrome.storage || !chrome.storage.sync || !chrome.storage.sync.get) {
        throw new TypeError("Bad environment");
    }

    function getSize(keys) {
        var size = 0;

        if (typeof keys === "string") {
            keys = [keys]; // convert it into an array
        }

        return new Promise(function (resolve, reject) {
            // note: in FF <= 47 browser.storage.sync.get does not return a Promise object
            // we use a callback instead for backwards compatibility
            browser.storage.sync.get(keys, function (results) {
                var lastError = browser.runtime.lastError;

                if (lastError) {
                    reject(lastError);
                    return;
                }

                if (keys === null) {
                    size += (JSON.stringify(results)).length;
                } else {
                    keys.forEach(function (key) {
                        size += (key + JSON.stringify(results[key])).length;
                    });
                }

                resolve(size);
            });
        });
    }

    browser.storage.sync.getBytesInUse = browser.storage.sync.getBytesInUse || function (keys, callback)  {
        if (callback === undefined) {
            return getSize(keys);
        }

        if (typeof callback !== "function") {
            throw new Error("callback is not a function");
        }

        getSize(keys).then(callback).catch(function (lastError) {
            if (Object.prototype.hasOwnProperty(chrome.runtime, "lastError")) { // does this browser support the lastError property?
                browser.runtime.lastError = lastError;
            } else {
                throw new Error(lastError);
            }
        });
    };

    chrome.storage.sync.getBytesInUse = chrome.storage.sync.getBytesInUse || function (keys, callback) {
        if (typeof callback !== "function") {
            throw new TypeError("callback is not a function");
        }

        browser.storage.sync.getBytesInUse(keys, callback);
    };
}());
