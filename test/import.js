QUnit.module("rdf import", {
    beforeEach: function() {
        this.rdf_doc1 = RdfImporter.loadDoc(document.getElementById("rdf1").value);
    },
    afterEach: function() {
        Settings.profiles = [];
        chrome.storage.local.clear();
    }
});

QUnit.test("parse global settings", function(assert) {
    var s = this.rdf_doc1.settings;

    assert.equal(s.rdf_about, "http://passwordmaker.mozdev.org/globalSettings");
    assert.equal(s.hideMasterPassword, false);
    assert.equal(s.storeLocation, "memory");
});

QUnit.test("find profiles", function(assert) {
    assert.equal(this.rdf_doc1.profiles.length, 2);
});

QUnit.test("load profile", function(assert) {
    var p = this.rdf_doc1.profiles[1];

    assert.equal(p.rdf_about, "rdf:#$5PGpU1");
    assert.equal(p.title, "nospecial");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "hmac-sha256_fix");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 20);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "before-hashing");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "/https?://mail\\.yahoo\\.com/.*/ http?://github.com/*");
});

QUnit.test("load default profile", function(assert) {
    var p = this.rdf_doc1.profiles[0];

    assert.equal(p.rdf_about, "http://passwordmaker.mozdev.org/defaults");
    assert.equal(p.title, "Defaults");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "sha256");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 15);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "off");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "");
});

QUnit.test("save profiles", async function(assert) {
    var profiles = this.rdf_doc1.profiles;

    assert.equal(profiles.length, 2);
    await Settings.loadProfiles().then(() => {
        assert.equal(Settings.profiles.length, 2);
        RdfImporter.saveProfiles(profiles);
        assert.equal(Settings.profiles.length, 4);
    });
});

QUnit.test("save settings", function(assert) {
    chrome.storage.local.set({ "hide_generated_password": true, "store_location": "memory" }).then(() => {
        chrome.storage.local.get(["hide_generated_password", "store_location"]).then((result) => {
            assert.equal(result["hide_generated_password"], true);
            assert.equal(result["store_location"], "memory");
        });
    });
});

QUnit.module("rdf export", {
    beforeEach: async function() {
        await Settings.loadProfiles().then(() => {
            this.rdf_doc1 = RdfImporter.loadDoc(document.getElementById("rdf1").value);
            RdfImporter.saveProfiles(this.rdf_doc1.profiles);
            this.doc2 = RdfImporter.loadDoc(RdfImporter.dumpDoc());
        });
    },
    afterEach: function() {
        Settings.profiles = [];
        chrome.storage.local.clear();
    }
});

QUnit.test("dump profile to rdf", function(assert) {
    var p = this.doc2.profiles[3];

    assert.equal(p.rdf_about, "rdf:#$CHROME4");
    assert.equal(p.title, "nospecial");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "hmac-sha256_fix");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 20);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "before-hashing");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "/https?://mail\\.yahoo\\.com/.*/ http?://github.com/*");
});

QUnit.test("dump default profile to rdf", function(assert) {
    var p = this.doc2.profiles[2];

    assert.equal(p.rdf_about, "rdf:#$CHROME3");
    assert.equal(p.title, "Defaults");
    assert.equal(p.url_protocol, false);
    assert.equal(p.url_subdomain, false);
    assert.equal(p.url_domain, true);
    assert.equal(p.url_path, true);
    assert.equal(p.hashAlgorithm, "sha256");
    assert.equal(p.username, "username1");
    assert.equal(p.modifier, "modifier1");
    assert.equal(p.passwordLength, 15);
    assert.equal(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%");
    assert.equal(p.passwordPrefix, "prefix1");
    assert.equal(p.passwordSuffix, "suffix1");
    assert.equal(p.whereToUseL33t, "off");
    assert.equal(p.l33tLevel, 1);
    assert.equal(p.siteList, "");
});

QUnit.module("password generation", {
    beforeEach: async function() {
        await Settings.loadProfiles().then(() => {
            this.p = Settings.profiles[0];
            this.url = "passwordmaker.org";
            this.pass = decodeURI("PasswordMaker%C2%A9%E2%82%AC%F0%A4%AD%A2"); // dont rely on unicode text editor
        });
    },
    afterEach: function() {
        Settings.profiles = [];
        chrome.storage.local.clear();
    }
});

QUnit.test("algorithms", function(assert) {
    this.p.hashAlgorithm = "md4";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "SFAkbkwxL34=", "MD4 variant");
    this.p.hashAlgorithm = "hmac-md4";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "RCN8R3tmZjc=", "HMAC-MD4 variant");
    this.p.hashAlgorithm = "md5";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Sj5TJ3BdVFA=", "MD5 variant");
    this.p.hashAlgorithm = "md5_v6";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "ZTAwM2U1YzI=", "MD5 Version 0.6 variant");
    this.p.hashAlgorithm = "hmac-md5";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "SnYnIlIqRjc=", "HMAC-MD5 variant");
    this.p.hashAlgorithm = "hmac-md5_v6";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "ODY4M2M4Mjc=", "HMAC-MD5 Version 0.6 variant");
    this.p.hashAlgorithm = "sha1";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "NHEzImJNXkQ=", "SHA-1 variant");
    this.p.hashAlgorithm = "hmac-sha1";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Q1JtdmdsZ1E=", "HMAC-SHA-1 variant");
    this.p.hashAlgorithm = "sha256";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "NWVueCklb1o=", "SHA-256 variant");
    this.p.hashAlgorithm = "hmac-sha256_fix";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "fjVtT2F9NXQ=", "HMAC-SHA-256 variant");
    this.p.hashAlgorithm = "hmac-sha256";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "UHw4TDt8dFw=", "HMAC-SHA-256 Version 1.5.1 variant");
    this.p.hashAlgorithm = "rmd160";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "RGBCQm9nIyM=", "RIPEMD-160 variant");
    this.p.hashAlgorithm = "hmac-rmd160";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "QiMrbkMjcio=", "HMAC-RIPEMD-160 variant");
    this.p.l33tLevel = 9;
    this.p.hashAlgorithm = "md5";
    this.p.whereToUseL33t = "before-hashing";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "RWs4TnZyLWg=", "Before L33t variant");
    this.p.whereToUseL33t = "after-hashing";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "X3w+JCd8Pl0=", "After L33t variant");
    this.p.whereToUseL33t = "both";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Jnx7OHxcfFw=", "Befor & After L33t variant");
});
