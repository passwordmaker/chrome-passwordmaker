function Profile() {
    this.id = 1;
    this.title = "Default";
    this.siteList = "";

    // Settings for the URL generation
    this.url_protocol = false;
    this.url_subdomain = false;
    this.url_domain = true;
    this.url_path = false;

    // Use this text instead of domain if not null
    this.strUseText = "";

    // Settings for the key generation
    this.hashAlgorithm = "md5";
    this.username = "";
    this.modifier = "";
    this.passwordLength = 8;
    this.selectedCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\\:\";'<>?,./";
    this.passwordPrefix = "";
    this.passwordSuffix = "";
    this.whereToUseL33t = "off";
    this.l33tLevel = 0;
}

Profile.prototype.getPassword = function(url, masterkey) {
    if (this.selectedCharset.length < 2) {
        return "Not enough chars!";
    }

    // Calls generatepassword() n times in order to support passwords
    // of arbitrary length regardless of character set length.
    var password = "";
    var count = 0;
    while (password.length < this.passwordLength) {
        // To maintain backwards compatibility with all previous versions of passwordmaker,
        // the first call to _generatepassword() must use the plain "key".
        // Subsequent calls add a number to the end of the key so each iteration
        // doesn't generate the same hash value.
        password += (count == 0) ? 
        this.generateCharacter(this.hashAlgorithm, masterkey, 
        url + this.username + this.modifier, this.whereToUseL33t, this.l33tLevel, 
        this.selectedCharset) : 
        this.generateCharacter(this.hashAlgorithm, masterkey + '\n' + count, 
        url + this.username + this.modifier, this.whereToUseL33t, this.l33tLevel, 
        this.selectedCharset);
        count++;
    }

    if (this.passwordPrefix) {
        password = this.passwordPrefix + password;
    }
    if (this.passwordSuffix) {
        password = password.substring(0, this.passwordLength - this.passwordSuffix.length) + this.passwordSuffix;
    }
    
    return password.substring(0, this.passwordLength);
}

Profile.prototype.generateCharacter = function(hashAlgorithm, key, data, whereToUseL33t, l33tLevel, charset) {
    // for non-hmac algorithms, the key is master pw and url concatenated
    var usingHMAC = hashAlgorithm.indexOf("hmac") > -1;
    if (!usingHMAC) {
        key += data;
    }

    // apply l33t before the algorithm?
    if (whereToUseL33t == "both" || whereToUseL33t == "before-hashing") {
        key = PasswordMaker_l33t.convert(l33tLevel, key);
        if (usingHMAC) {
            data = PasswordMaker_l33t.convert(l33tLevel, data); // new for 0.3; 0.2 didn't apply l33t to _data_ for HMAC algorithms
        }
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
            password = PasswordMaker_MD5_V6.hex_md5(key, charset);
            break;
        case "hmac-md5":
            password = PasswordMaker_MD5.any_hmac_md5(key, data, charset);
            break;
        case "hmac-md5_v6":
            password = PasswordMaker_MD5_V6.hex_hmac_md5(key, data, charset);
            break;
        case "rmd160":
            password = PasswordMaker_RIPEMD160.any_rmd160(key, charset);
            break;
        case "hmac-rmd160":
            password = PasswordMaker_RIPEMD160.any_hmac_rmd160(key, data, charset);
            break;
    }
    // apply l33t after the algorithm?
    if (whereToUseL33t == "both" || whereToUseL33t == "after-hashing") {
        return PasswordMaker_l33t.convert(l33tLevel, password);
    }
    return password;
}

// Given a list of domain segments like [www,google,co,uk], return the
// subdomain and domain strings (ie, [www, google.co.uk]).
Profile.prototype.splitSubdomain = function(segments) {
    for (var i = 0; i < segments.length; ++i) {
        var suffix = segments.slice(i).join('.');
        if (TOPLEVELDOMAINS[suffix]) {
            var pivot = Math.max(0, i - 1);
            return [segments.slice(0, pivot).join('.'), segments.slice(pivot).join('.')];
        }
    }
    // None of the segments are in our TLD list. Assume the last component is
    // the TLD, like ".com". The domain is therefore the last 2 components.
    return [segments.slice(0, -2).join('.'), segments.slice(-2).join('.')];
}

// Return strUseText
Profile.prototype.getText = function(url) {
    return this.strUseText;
}

Profile.prototype.getUrl = function(url) {
    var temp = url.match("([^://]*://)?([^:/]*)([^#]*)");
    if (!temp) {
        temp = ['','','','']; // Helps prevent an undefine based error
    }

    var domainSegments = temp[2].split(".");
    while (domainSegments.length < 3) {
        domainSegments.unshift(''); // Helps prevent the URL from displaying undefined in the URL to use box
    }

    var resultURL = '';
    var protocol= this.url_protocol ? temp[1] : ''; // set the protocol or empty string
    var splitSegments = this.splitSubdomain(domainSegments);
    if (this.url_subdomain) {
        resultURL += splitSegments[0];
    }
    if (this.url_domain) {
        if (resultURL != "" && resultURL[resultURL.length - 1] != ".") {
            resultURL += ".";
        }
        resultURL += splitSegments[1];
    }

    resultURL = protocol + resultURL;

    if (this.url_path) {
        resultURL += temp[3];
    }

    return resultURL;
}

Profile.prototype.getVerificationCode = function(masterPassword) {
    var p = new Profile();
    p.hashAlgorithm = "sha256";
    p.passwordLength = 3;
    p.selectedCharset = CHARSET_OPTIONS[4];
    return p.getPassword("", masterPassword);
}
