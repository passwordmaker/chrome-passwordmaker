//mock chrome.storage.local API for unit testing
var chrome = {
    "storage": {
        "local": {
            "get": function (keys, callback) {
                return new Promise(resolve => {
                    let result = {};
                    if (!keys) {
                        result = { ...localStorage };
                    } else {
                        if (Array.isArray(keys)) {
                            keys.forEach(function (key) {
                                if (localStorage.getItem(key)) {
                                    result = { ...result, [key]: JSON.parse(localStorage.getItem(key)) };
                                }
                            })
                        } else {
                            if (keys.constructor.name === "Object") {
                                let all_keys = {};
                                for (const [key, value] of Object.entries(keys)) {
                                    let ls_stored_value = JSON.parse(localStorage.getItem(key));
                                    if (!ls_stored_value) {
                                        chromeMockSet({ [key]: value });
                                        ls_stored_value = JSON.parse(localStorage.getItem(key));
                                    }
                                    all_keys[key] = ls_stored_value;
                                }
                                result = all_keys;
                            } else {
                                if (localStorage.getItem(keys)) {
                                    result = { ...result, [keys]: JSON.parse(localStorage.getItem(keys)) };
                                }
                            }
                        }
                    }
                    for (const [k, v] of Object.entries(result)) {
                        if (!isNaN(v)) {
                            result[k] = Number(v);
                        }
                        if (v === `false`) {
                            result[k] = false;
                        }
                        if (v === `true`) {
                            result[k] = true;
                        }
                    }
                    if (callback) {
                        resolve(callback(result));
                    }
                    resolve(result);
                });
            },
            "set": function (object, callback) {
                return new Promise(resolve => {
                    for (const [key, value] of Object.entries(object)) {
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                    if (callback) {
                        resolve(callback());
                    }
                    resolve();
                });
            },
            "clear": function() {
                localStorage.clear();
            },
            "remove": function (key) {
                localStorage.removeItem(key);
            }
        }
    }
}
