var Profile = {
    id: 1,
    title: "Default",
    siteList: "",

    // Settings for the URL generation
    url_protocol: false,
    url_subdomain: false,
    url_domain: true,
    url_path: false,

    // Use this text instead of domain if not null
    strUseText: "",

    // Settings for the key generation
    hashAlgorithm: "md5",
    username: "",
    modifier: "",
    passwordLength: 8,
    selectedCharset: CHARSET_OPTIONS[0],
    passwordPrefix: "",
    passwordSuffix: "",
    timestamp: 0,
    description: "",
    whereToUseL33t: "off",
    l33tLevel: 0
};

Profile.getPassword = function(url, masterkey, userName) {
    if (this.selectedCharset.length < 2) {
        return "Not enough chars!";
    }

    this.username = userName || "";

    // Calls generatepassword() n times in order to support passwords
    // of arbitrary length regardless of character set length.
    var password = "";
    for (var count = 0; password.length < this.passwordLength; count++) {
        // To maintain backwards compatibility with all previous versions of passwordmaker,
        // the first call to _generatepassword() must use the plain "key".
        // Subsequent calls add a number to the end of the key so each iteration
        // doesn't generate the same hash value.
        if (count === 0) {
            password += this.generateCharacter(this.hashAlgorithm, masterkey,
                url + this.username + this.modifier, this.whereToUseL33t, this.l33tLevel, this.selectedCharset);
        } else {
            password += this.generateCharacter(this.hashAlgorithm, masterkey + "\n" + count,
                url + this.username + this.modifier, this.whereToUseL33t, this.l33tLevel, this.selectedCharset);
        }
    }

    if (this.passwordPrefix) {
        password = this.passwordPrefix + password;
    }
    if (this.passwordSuffix) {
        password = password.slice(0, this.passwordLength - this.passwordSuffix.length) + this.passwordSuffix;
    }

    return password.slice(0, this.passwordLength);
};

Profile.generateCharacter = function(hashAlgorithm, key, data, whereToUseL33t, l33tLevel, charset) {
    // for non-hmac algorithms, the key is master pw and url concatenated
    var usingHMAC = (/hmac/i).test(hashAlgorithm);
    if (!usingHMAC) {
        key += data;
    }

    // apply l33t before the algorithm?
    if (whereToUseL33t === "both" || whereToUseL33t === "before-hashing") {
        key = PasswordMaker_l33t.convert(l33tLevel, key);
        if (usingHMAC) {
            data = PasswordMaker_l33t.convert(l33tLevel, data); // new for 0.3; 0.2 didn't apply l33t to _data_ for HMAC algorithms
        }
    }

    // convert string only if it contains a non-ascii multi-byte character before passing to algorithms
    // the md5_v6 algorithm apparently never used converted string data
    var md5v6 = /md5_v6/i;
    var notAscii = /[^\u0000-\u007F]/;
    if (notAscii.test(key) && !md5v6.test(hashAlgorithm)) {
        key = unescape(encodeURI(key));
    }
    if (notAscii.test(data) && !md5v6.test(hashAlgorithm)) {
        data = unescape(encodeURI(data));
    }

    // apply the algorithm
    var password = "";
    switch (hashAlgorithm) {
        case "sha256":
            password = PasswordMaker_SHA256.any_sha256(key, charset);
            break;
        case "hmac-sha256":
            password = PasswordMaker_SHA256.any_hmac_sha256(key, data, charset, true);
            break;
        case "hmac-sha256_fix":
            password = PasswordMaker_SHA256.any_hmac_sha256(key, data, charset, false);
            break;
        case "sha1":
            password = PasswordMaker_SHA1.any_sha1(key, charset);
            break;
        case "hmac-sha1":
            password = PasswordMaker_SHA1.any_hmac_sha1(key, data, charset);
            break;
        case "md4":
            password = PasswordMaker_MD4.any_md4(key, charset);
            break;
        case "hmac-md4":
            password = PasswordMaker_MD4.any_hmac_md4(key, data, charset);
            break;
        case "md5":
            password = PasswordMaker_MD5.any_md5(key, charset);
            break;
        case "md5_v6":
            password = PasswordMaker_MD5_V6.hex_md5(key);
            break;
        case "hmac-md5":
            password = PasswordMaker_MD5.any_hmac_md5(key, data, charset);
            break;
        case "hmac-md5_v6":
            password = PasswordMaker_MD5_V6.hex_hmac_md5(key, data);
            break;
        case "rmd160":
            password = PasswordMaker_RIPEMD160.any_rmd160(key, charset);
            break;
        case "hmac-rmd160":
            password = PasswordMaker_RIPEMD160.any_hmac_rmd160(key, data, charset);
            break;
    }
    // apply l33t after the algorithm?
    if (whereToUseL33t === "both" || whereToUseL33t === "after-hashing") {
        return PasswordMaker_l33t.convert(l33tLevel, password);
    }
    return password;
};

// Given a list of domain segments like [www,google,co,uk], return the
// subdomain and domain strings (ie, [www, google.co.uk]).
Profile.splitSubdomain = function(segments) {
    for (var i = 0; i < segments.length; ++i) {
        var suffix = segments.slice(i).join(".");
        if (TOPLEVELDOMAINS[suffix]) {
            var pivot = Math.max(0, i - 1);
            return [segments.slice(0, pivot).join("."), segments.slice(pivot).join(".")];
        }
    }
    // None of the segments are in our TLD list. Assume the last component is
    // the TLD, like ".com". The domain is therefore the last 2 components.
    return [segments.slice(0, -2).join("."), segments.slice(-2).join(".")];
};

// Return strUseText
Profile.getText = function() {
    return this.strUseText;
};

Profile.getUsername = function() {
    return this.username;
};

Profile.getUrl = function(url) {
    var groups = url.match(/([^:\/]*?:\/\/)?([^:\/]*)([^#]*)/);

    var domainSegments = groups[2].split(".");
    while (domainSegments.length < 3) {
        domainSegments.unshift(""); // Helps prevent the URL from displaying undefined in the URL to use box
    }

    var resultURL = "";
    if (this.url_protocol && groups[1] !== undefined) {
        resultURL += groups[1];
    }
    var splitSegments = this.splitSubdomain(domainSegments);
    if (this.url_subdomain) {
        resultURL += splitSegments[0];
    }
    if (this.url_domain) {
        if (resultURL.length !== 0 && resultURL[resultURL.length - 1] !== "." && resultURL[resultURL.length - 1] !== "/") {
            resultURL += ".";
        }
        resultURL += splitSegments[1];
    }
    if (this.url_path) {
        resultURL += groups[3];
    }

    return resultURL;
};
