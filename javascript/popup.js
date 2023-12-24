function setPasswordColors(foreground, background) {
    $("#generated, #password, #confirmation").css({
        "background-color": background,
        "color": foreground
    });
}

function getAutoProfileIdForUrl() {
    for (var i = 0; i < Settings.profiles.length; i++) {
        var profile = Settings.profiles[i];
        if (profile.siteList.trim().length !== 0) {
            var sites = profile.siteList.trim().split(/\s+/);
            for (var j = 0; j < sites.length; j++) {
                var regexString = /\s/;
                if ((/^\/.*\/.*$/).test(sites[j])) {
                    try {
                        regexString = new RegExp(sites[j].replace(/^\/|\/.*$/g, ""));
                    } catch (e) { void(0) }
                }
                var plain2regex = sites[j];
                plain2regex = plain2regex.replace(/[$+()^[\]\\|{},]/g, "");
                plain2regex = plain2regex.replace(/\?/g, ".");
                plain2regex = plain2regex.replace(/\*/g, ".*");
                var wildcardString = new RegExp(plain2regex, "i");

                if (regexString.test(Settings.currentUrl) || wildcardString.test(Settings.currentUrl)) {
                    return profile.id;
                }
            }
        }
    }
}

function passwordFieldSuccess() {
    var profile = Settings.getProfile($("#profile").val());
    var profileResult = profile.getPassword($("#usedtext").val(), $("#password").val(), $("#username").val());
    $("#generated").val(profileResult);
    setPasswordColors("#008000", "#FFFFFF");
    $("#password, #confirmation").removeAttr("style");
    showButtons();
    return Settings.getPasswordStrength(profileResult).strength;
}

function updateFields() {
    var password = $("#password").val();
    var confirmation = $("#confirmation").val();
    var passStrength = 0;

    chrome.storage.local.get(["keep_master_password_hash", "master_password_hash", "show_password_strength", "storeLocation", "use_verification_code"]).then((result) => {
        if (password.length === 0) {
            $("#generated").val("Please Enter Password");
            setPasswordColors("#000000", "#85FFAB");
            hideButtons();
        } else if (result["keep_master_password_hash"] && result["master_password_hash"]) {
            var saved = JSON.parse(result["master_password_hash"]);
            var derived = Settings.make_pbkdf2(password, saved.salt, saved.iter);
            if (derived.hash !== saved.hash) {
                $("#generated").val("Master Password Mismatch");
                setPasswordColors("#FFFFFF", "#FF7272");
                hideButtons();
            } else {
                passStrength = passwordFieldSuccess();
            }
        } else if (!result["use_verification_code"] && !result["keep_master_password_hash"] && (password !== confirmation)) {
            $("#generated").val("Passwords Don't Match");
            setPasswordColors("#FFFFFF", "#FF7272");
            hideButtons();
        } else {
            passStrength = passwordFieldSuccess();
        }

        if (result["show_password_strength"]) {
            $("meter").val(passStrength);
            $("#strengthValue").text(passStrength);
        }

        if (result["use_verification_code"]) {
            $("#verificationCode").val(getVerificationCode(password));
        }

        Settings.setPassword(password);

        if ($("#password").val() === "") {
            $("#password").focus();
        }
    });
}

function delayedUpdate() {
    clearTimeout(window.delayedUpdateID);
    window.delayedUpdateID = setTimeout(updateFields, 800);
}

function updateProfileText() {
    var profile = Settings.getProfile($("#profile").val());
    // Store either matched url or, if set, use profiles own "use text"
    if (profile.getText().length !== 0) {
        $("#usedtext").val(profile.getText());
    } else {
        $("#usedtext").val(profile.getUrl(Settings.currentUrl));
    }
    if (profile.getUsername().length !== 0) {
        $("#username").val(profile.getUsername());
    } else {
        $("#username").val("");
    }
}

function onProfileChanged() {
    updateProfileText();
    updateFields();
}

function hideButtons() {
    if (!$("#copypassword").hasClass("hidden")) {
        $("#copypassword").addClass("hidden");
    }
    if (!$("#injectpassword").hasClass("hidden")) {
        $("#injectpassword").addClass("hidden");
    }
}

function showButtonsScript() {
    var fields = document.getElementsByTagName("input"), fieldCount = 0;
    for (var i = 0; i < fields.length; i++) {
        if (/password/i.test(fields[i].type + ' ' + fields[i].name)) {
            fieldCount += 1;
        }
    }
    return fieldCount;
}

function showButtons() {
    $("#copypassword").removeClass("hidden");
    // Don't run executeScript() on built-in chrome://, opera:// or about:// browser pages since it isn't allowed anyway
    // Also cant run on the Chrome Web Store/Extension Gallery
    if (!(/^about|^(chrome|chrome-extension)|(chrome|chromewebstore)\.google\.com|^opera/i).test(Settings.currentUrl)) {
        chrome.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id, allFrames: true},
                func: showButtonsScript,
            }).then(fieldCounts => {
                for (var frame = 0; frame < fieldCounts.length; frame++) {
                    if (fieldCounts[frame].result > 0) {
                        $("#injectpassword").removeClass("hidden");
                    }
                }
            }).catch((err) => {
                console.log("Show button error: " + err.message);
            });
        });
    }
}

function fillFieldsScript(args) {
    // base-64 encode & decode password, string concatenation of a pasword that includes quotes here won't work
    var fields = document.getElementsByTagName("input");
    var nameFilled = false, passFilled = false;
    function isRendered(domObj) {
        var cs = document.defaultView.getComputedStyle(domObj);
        if ((domObj.nodeType !== 1) || (domObj == document.body)) return true;
        if (cs.display !== "none" && cs.visibility !== "hidden") return isRendered(domObj.parentNode);
        return false;
    }
    for (var i = 0; i < fields.length; i++) {
        var elStyle = getComputedStyle(fields[i]);
        var isVisible = isRendered(fields[i]) && (parseFloat(elStyle.width) > 0) && (parseFloat(elStyle.height) > 0);
        var isPasswordField = (/password/i).test(fields[i].type + ' ' + fields[i].name);
        var isUsernameField = (/id|un|name|user|usr|log|email|mail|acct|ssn/i).test(fields[i].name) && (/^(?!display)/i).test(fields[i].name);
        var changeEvent = new Event("change"); // MVC friendly way to force a view-model update
        if (isVisible && !passFilled && fields[i].value.length === 0 && isPasswordField) {
            fields[i].value = args[0];
            passFilled = true;
            fields[i].dispatchEvent(changeEvent);
        }
        if (isVisible && !nameFilled && fields[i].value.length === 0 && isUsernameField) {
            fields[i].value = args[1];
            if (fields[i].value.length === 0) {
                fields[i].focus();
            }
            nameFilled = true;
            fields[i].dispatchEvent(changeEvent);
        }
    }
}

function fillFields(generatedPass) {
    updateFields();
    // Don't run executeScript() on built-in chrome://, opera:// or about:// browser pages since it isn't allowed anyway
    // Also cant run on the Chrome Web Store/Extension Gallery
    if (!(/^about|^(chrome|chrome-extension)|(chrome|chromewebstore)\.google\.com|^opera/i).test(Settings.currentUrl)) {
        chrome.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id, allFrames: true},
                args : [ generatedPass ],
                func: fillFieldsScript,
            }).then(() => {
                window.close();
            }).catch((err) => {
                console.log("Fill field error: " + err.message);
            });
        });
    }
}

function copyPassword() {
    updateFields();
    chrome.tabs.query({
        "windowType": "popup"
    }).then(() => {
        navigator.clipboard.writeText($("#generated").val()).then(() => {
            window.close();
        });
    });
}

function openOptions() {
    chrome.tabs.create({
        "url": chrome.runtime.getURL("html/options.html")
    }).then(() => {
        window.close();
    });
}

function getVerificationCode(password) {
    var p = Object.create(Profile);
    p.hashAlgorithm = "sha256";
    p.passwordLength = 3;
    p.selectedCharset = CHARSET_OPTIONS[4];
    return p.getPassword("", password, "");
}

function showPasswordField() {
    $("#activatePassword").hide();
    $("#generated").show();
    chrome.storage.local.get(["show_password_strength"]).then((result) => {
        if (result["show_password_strength"]) {
            $("#strength_row").show();
        }
    });
}

function handleKeyPress(event) {
    if (event.code === "Enter" && !(/select/i).test(event.target.tagName)) {
        if ((/password/i).test($("#generated").val())) {
            $("#password").focus();
        } else {
            fillFields([$("#generated").val(), $("#username").val()]);
        }
    }

    // ctrl/option + c to copy the password to clipboard and close the popup
    if ((event.ctrlKey || event.metaKey) && event.code === "KeyC") {
        copyPassword();
    }
}

function sharedInit(decryptedPass) {
    chrome.storage.local.get(["alpha_sort_profiles"]).then((result) => {
        $("#password").val(decryptedPass);
        $("#confirmation").val(decryptedPass);

        if (result["alpha_sort_profiles"]) Settings.alphaSortProfiles();
        Settings.profiles.forEach((profile) => {
            $("#profile").append(new Option(profile.title, profile.id));
        })
        $("#profile").val(getAutoProfileIdForUrl() || Settings.profiles[0].id);

        updateProfileText();
        updateFields();
    });
}

function initPopup() {
    chrome.storage.local.get(["storeLocation"]).then((result) => {
        if (result["storeLocation"] === undefined) {
            chrome.storage.local.set({ "password": "" }).then(() => {
                chrome.storage.session.set({ "password": "" }).then(() => {
                    updateFields();
                });
            });
        } else if ((result["storeLocation"] === "memory") || (result["storeLocation"] === "memory_expire")) {
            chrome.storage.session.get(["password", "password_key"]).then((result) => {
                sharedInit(Settings.decrypt(result["password_key"], result["password"]));
            });
        } else if ((result["storeLocation"] === "disk")) {
            chrome.storage.local.get(["password_key", "password_crypt"]).then((result) => {
                sharedInit(Settings.decrypt(result["password_key"], result["password_crypt"]));
            });
        }  else if ((result["storeLocation"] === "never")) {
            sharedInit("");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["storeLocation"]).then((result) => {
        if (result["storeLocation"] === undefined) {
            chrome.storage.local.set({ "storeLocation": "memory" });
        }
        Settings.migrateFromStorage();

        Settings.loadProfiles(() => {
            $("#password, #confirmation").on("keyup", Settings.setPassword);
            $("input").on("input", delayedUpdate);
            $("#profile").on("change", onProfileChanged);
            $("#activatePassword").on("click", showPasswordField);
            $("#copypassword").on("click", copyPassword);
            $("#options").on("click", openOptions);

            chrome.storage.local.get(["show_generated_password", "keep_master_password_hash", "use_verification_code", "show_password_strength"]).then((result) => {
                if (result["show_generated_password"] === true) {
                    $("#generated, #strength_row").hide();
                } else {
                    $("#activatePassword").hide();
                }

                if ((result["keep_master_password_hash"] === true) || result["use_verification_code"] === true) {
                    $("#confirmation_row").hide();
                }

                if (!result["use_verification_code"]) {
                    $("#verification_row").hide();
                }

                if (!result["show_password_strength"]) {
                    $("#strength_row").hide();
                }
            });

            chrome.tabs.query({
                "active": true,
                "currentWindow": true,
                "windowType": "normal"
            }).then((tabs) => {
                Settings.currentUrl = tabs[0].url || "";
                initPopup();
            });

            $("#injectpassword").on("click", () => {
                fillFields([$("#generated").val(), $("#username").val()]);
            });

            $(document.body).on("keydown", handleKeyPress);
        });
    });
});
