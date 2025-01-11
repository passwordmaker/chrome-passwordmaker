function qs$(sel) {
    return document.querySelector(sel);
}

function qsa$(sel) {
    return document.querySelectorAll(sel);
}

function setPasswordColors(foreground, background) {
    qsa$("#generated, #password, #confirmation").forEach((el) => {
        el.style.backgroundColor = background;
        el.style.color = foreground;
    });
}

function getAutoProfileIdForUrl() {
    var match = 0,
        found = false;
    for (let profile of Settings.profiles) {
        if (found) {
            break;
        } else {
            if (profile.siteList.trim().length > 0) {
                for (let pattern of profile.siteList.trim().split(/\s+/)) {
                    var regex = /\s/;
                    if (pattern.startsWith("/") && pattern.endsWith("/")) {
                        regex = new RegExp(pattern.slice(1, -1), "i");
                    } else {
                        var plain2regex = pattern.replace(/[$+()^[\]\\|{},]/g, "").replace(/\./g, "\\.").replace(/\?/g, ".").replace(/\*/g, ".*");
                        regex = new RegExp(plain2regex, "i");
                    }
                    if (regex.test(Settings.currentUrl)) {
                        match = profile.id;
                        found = true;
                        break;
                    }
                }
            }
        }
    }
    return match;
}

function setPassword() {
    chrome.storage.local.get(["storeLocation"]).then((result) => {
        if (result["storeLocation"] === "never") {
            chrome.storage.session.remove("password")
                .then(() => chrome.storage.local.remove("password"));
        } else {
            var bits = crypto.getRandomValues(new Uint32Array(8));
            var key = sjcl.codec.base64.fromBits(bits);
            var encrypted = Settings.encrypt(key, qs$("#password").value);
            switch (result["storeLocation"]) {
                case "memory":
                    chrome.storage.session.set({ "password": encrypted, "password_key": key });
                    break;
                case "memory_expire":
                    chrome.storage.session.set({ "password": encrypted, "password_key": key })
                        .then(() => Settings.createExpirePasswordAlarm());
                    break;
                case "disk":
                    chrome.storage.local.set({ "password_crypt": encrypted, "password_key": key });
                    break;
            }
        }
    }).catch((err) => console.trace(`Could not run Settings.setPassword: ${err}`));
};

function passwordFieldSuccess() {
    setPassword();
    var profile = Settings.getProfileById(qs$("#profile").value);
    var profileResult = profile.genPassword(qs$("#usedtext").value, qs$("#password").value, qs$("#username").value);
    qs$("#generated").value = profileResult;
    setPasswordColors("#008000", "#FFFFFF");
    qsa$("#password, #confirmation").forEach((el) => el.removeAttribute("style"));
    showButtons();
    return Settings.getPasswordStrength(profileResult).strength;
}

function updateFields() {
    var passwordEl = qs$("#password");
    var confirmationEl = qs$("#confirmation");
    var passStrength = 0;

    return chrome.storage.local.get(["master_password_hash", "show_password_strength", "storeLocation", "use_verification_code"]).then((result) => {
        if (passwordEl.value.length === 0) {
            qs$("#generated").value = "Please Enter Password";
            setPasswordColors("#000000", "#85FFAB");
            hideButtons();
        } else if (result["master_password_hash"]) {
            var saved = JSON.parse(result["master_password_hash"]);
            var derived = Settings.make_pbkdf2(passwordEl.value, saved.salt, saved.iter);
            if (derived.hash !== saved.hash) {
                qs$("#generated").value = "Master Password Mismatch";
                setPasswordColors("#FFFFFF", "#FF7272");
                hideButtons();
            } else {
                passStrength = passwordFieldSuccess();
            }
        } else if (!result["use_verification_code"] && !result["master_password_hash"] && (passwordEl.value !== confirmationEl.value)) {
            qs$("#generated").value = "Passwords Don't Match";
            setPasswordColors("#FFFFFF", "#FF7272");
            hideButtons();
        } else {
            passStrength = passwordFieldSuccess();
        }

        if (result["show_password_strength"]) {
            qs$("#popupMeter").value = passStrength;
            qs$("#strengthValue").textContent = passStrength;
        }

        if (result["use_verification_code"]) {
            qs$("#verificationCode").value = getVerificationCode(passwordEl.value);
        }

        if (passwordEl.value === "") {
            passwordEl.focus();
        }
    }).catch((err) => console.trace(`Could not run updateFields: ${err}`));
}

function delayedUpdate() {
    clearTimeout(window.delayedUpdateID);
    window.delayedUpdateID = setTimeout(updateFields, 800);
}

function updateProfileText() {
    var profile = Settings.getProfileById(qs$("#profile").value);
    // Store either matched url or, if set, use profiles own "use text"
    if (profile.strUseText.length !== 0) {
        qs$("#usedtext").value = profile.strUseText;
    } else {
        qs$("#usedtext").value = profile.getUrl(Settings.currentUrl);
    }
    if (profile.username.length !== 0) {
        qs$("#username").value = profile.username;
    } else {
        qs$("#username").value = "";
    }
}

function onProfileChanged() {
    updateProfileText();
    updateFields();
}

function hideButtons() {
    var copyPassEl = qs$("#copypassword");
    if (!copyPassEl.classList.contains("hidden")) {
        copyPassEl.classList.add("hidden");
        
    }
    var injectPassEl = qs$("#injectpassword");
    if (!injectPassEl.classList.contains("hidden")) {
        injectPassEl.classList.add("hidden");
    }
}

function showButtonsScript() {
    var reg = /acc|email|id|^log|^pass|user|usr|ssn/i;
    return Array.from(document.getElementsByTagName("input")).some((field) => reg.test(field.type) || reg.test(field.name) || reg.test(field.autocomplete));
}

function showButtons() {
    qs$("#copypassword").classList.remove("hidden");
    // Don't run executeScript() on built-in chrome://, opera:// or about:// or extension options pages
    // Also can't run on the Chrome Web Store/Extension Gallery
    if (!(Settings.executeScriptRegex).test(Settings.currentUrl)) {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }).then((tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id, allFrames: true},
                func: showButtonsScript,
            }).then((results) => {
                results.forEach((frame) => {
                    if (frame.result) qs$("#injectpassword").classList.remove("hidden");
                });
            }).catch((err) => console.trace(`Could not run showButtons: ${err}`));
        }).catch((err) => console.trace(`Could not run chrome.tabs.query in showButtons: ${err}`));
    }
}

function fillFieldsScript(args) {
    var nameFilled = false,
        passFilled = false;
    var passReg = /^pass/i,
        usrReg = /acc|email|id|^log|user|usr|ssn/i;
    var inputEvent = new Event("input", {bubbles: true}),
        changeEvent = new Event("change", {bubbles: true}),
        keyupEvent = new Event("keyup", {bubbles: true});
    function isRendered(domObj) {
        var cs = document.defaultView.getComputedStyle(domObj);
        if ((domObj.nodeType !== 1) || (domObj == document.body)) return true;
        if (cs.display !== "none" && cs.visibility !== "hidden") return isRendered(domObj.parentNode);
        return false;
    }
    Array.from(document.getElementsByTagName("input")).forEach((field) => {
        var elStyle = getComputedStyle(field);
        var isVisible = isRendered(field) && (parseFloat(elStyle.width) > 0) && (parseFloat(elStyle.height) > 0);
        var isPasswordField = passReg.test(field.type) || passReg.test(field.name) || passReg.test(field.autocomplete);
        var isUsernameField = usrReg.test(field.type) || usrReg.test(field.name) || usrReg.test(field.autocomplete);
        if (isVisible && !nameFilled && field.value.length === 0 && isUsernameField) {
            field.value = args[0];
            nameFilled = true;
            field.dispatchEvent(inputEvent); field.dispatchEvent(changeEvent); field.dispatchEvent(keyupEvent);
        }
        if (isVisible && !passFilled && field.value.length === 0 && isPasswordField) {
            field.value = args[1];
            passFilled = true;
            field.dispatchEvent(inputEvent); field.dispatchEvent(changeEvent); field.dispatchEvent(keyupEvent);
        }
    });
}

function fillFields(generatedArr) {
    updateFields().then(() => {
        // Don't run executeScript() on built-in chrome://, opera:// or about:// or extension options pages
        // Also can't run on the Chrome Web Store/Extension Gallery
        if (!(Settings.executeScriptRegex).test(Settings.currentUrl)) {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }).then((tabs) => {
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id, allFrames: true},
                    args : [ generatedArr ],
                    func: fillFieldsScript,
                })
                .then(() => window.close())
                .catch((err) => console.trace(`Fill field executeScript error: ${err}`));
            }).catch((err) => console.trace(`Could not run chrome.tabs.query in fillFields: ${err}`));
        }
    }).catch((err) => console.trace(`Could not run fillFields: ${err}`));
}

function copyPassword() {
    updateFields().then(() => {
        chrome.tabs.query({
            windowType: "popup",
            currentWindow: true
        }).then(() => {
            navigator.clipboard.writeText(qs$("#generated").value).then(() => window.close());
        }).catch((err) => console.trace(`Could not run chrome.tabs.query in copyPassword: ${err}`));
    }).catch((err) => console.trace(`Could not run copyPassword: ${err}`));
}

function openOptions() {
    chrome.runtime.openOptionsPage().then(() => window.close());
}

function getVerificationCode(password) {
    var p = new Profile();
    p.hashAlgorithm = "sha256";
    p.passwordLength = 3;
    p.selectedCharset = Settings.CHARSET_OPTIONS[4];
    return p.genPassword("", password, "");
}

function showPasswordField() {
    qs$("#activatePassword").style.display = "none";
    qs$("#generated").style.display = "";
    chrome.storage.local.get(["show_password_strength"]).then((result) => {
        if (result["show_password_strength"]) {
            qs$("#strength_row").style.display = "";
        }
    }).catch((err) => console.trace(`Could not run showPasswordField: ${err}`));
}

function handleKeyPress(event) {
    var generatedElVal = qs$("#generated").value;
    var usernameElVal = qs$("#username").value;
    if (/Enter/.test(event.code) && !(/select/i).test(event.target.tagName)) {
        if ((/Password/).test(generatedElVal)) {
            if (qs$("#confirmation").style.display !== "none") {
                qs$("#confirmation").focus();
            }
        } else {
            fillFields([usernameElVal, generatedElVal]);
        }
    }

    // ctrl/option + c to copy the password to clipboard and close the popup
    if ((event.ctrlKey || event.metaKey) && event.code === "KeyC") {
        copyPassword();
    }
}

function sharedInit(decryptedPass) {
    chrome.storage.local.get(["alpha_sort_profiles"]).then((result) => {
        qs$("#password").value = decryptedPass;
        qs$("#confirmation").value = decryptedPass;

        if (result["alpha_sort_profiles"]) Settings.alphaSortProfiles();
        var profileList = qs$("#profile");
        Settings.profiles.forEach((profile) => {
            profileList.append(new Option(profile.title, profile.id));
        });
        profileList.value = (getAutoProfileIdForUrl() || Settings.profiles[0].id);

        onProfileChanged();
    }).catch((err) => console.trace(`Could not run sharedInit: ${err}`));
}

function initPopup() {
    chrome.storage.local.get(["storeLocation"]).then((result) => {
        switch (result["storeLocation"]) {
            case "memory":
            case "memory_expire":
                chrome.storage.session.get(["password", "password_key"])
                    .then((result) => sharedInit(Settings.decrypt(result["password_key"], result["password"])));
                break;
            case "disk":
                chrome.storage.local.get(["password_key", "password_crypt"])
                    .then((result) => sharedInit(Settings.decrypt(result["password_key"], result["password_crypt"])));
                break;
            case "never":
                sharedInit("");
                break;
        }
    }).catch((err) => console.trace(`Could not run initPopup: ${err}`));
}

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["storeLocation", "zoomLevel"]).then((result) => {
        if (result["storeLocation"] === undefined) {
            chrome.storage.local.set({ "storeLocation": "memory" });
        }
        if (result["zoomLevel"]) {
            document.body.style.fontSize = (result["zoomLevel"].toString() + "%");
        } else {
            document.body.style.fontSize = "100%"
        }
        Settings.loadProfiles().catch((err) => console.trace(`Failure during popup Settings.loadProfiles: ${err}`))
        .then(() => {
            qsa$("input").forEach((el) => el.addEventListener("input", delayedUpdate));
            qs$("#profile").addEventListener("change", onProfileChanged);
            qs$("#activatePassword").addEventListener("click", showPasswordField);
            qs$("#copypassword").addEventListener("click", copyPassword);
            qs$("#options").addEventListener("click", openOptions);

            chrome.storage.local.get(["hide_generated_password", "master_password_hash", "use_verification_code", "show_password_strength"]).then((result) => {
                if (result["hide_generated_password"] === true) {
                    qsa$("#generated, #strength_row").forEach((el) => el.style.display = "none");
                } else {
                    qs$("#activatePassword").style.display = "none";
                }

                if (result["master_password_hash"] || result["use_verification_code"] === true) {
                    qs$("#confirmation_row").style.display = "none";
                }

                if (!result["use_verification_code"]) {
                    qs$("#verification_row").style.display = "none";
                }

                if (!result["show_password_strength"]) {
                    qs$("#strength_row").style.display = "none";
                }
            });

            chrome.tabs.query({
                active: true,
                currentWindow: true
            }).then((tabs) => {
                Settings.currentUrl = tabs[0].url || "";
                initPopup();
            }).catch((err) => console.trace(`Failure during chrome.tabs.query in popup page: ${err}`));

            qs$("#injectpassword").addEventListener("click", () => {
                fillFields([qs$("#username").value, qs$("#generated").value]);
            });

            document.body.addEventListener("keydown", handleKeyPress);
        });
    }).catch((err) => console.trace(`Failure during popup page load: ${err}`));
});
