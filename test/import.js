QUnit.module("rdf import", {
    setup: function() {
        this.rdf_doc1 = RdfImporter.loadDoc($("#rdf1").val());
    },
    teardown: function() {
        Settings.profiles = [];
        localStorage.clear();
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

QUnit.test("save profiles", function(assert) {
    var profiles = this.rdf_doc1.profiles;

    assert.equal(profiles.length, 2);
    Settings.loadProfiles();
    assert.equal(Settings.profiles.length, 2);

    RdfImporter.saveProfiles(profiles);
    assert.equal(Settings.profiles.length, 4);
});

QUnit.test("save settings", function(assert) {
    localStorage.setItem("show_generated_password", true);
    Settings.setStoreLocation("memory");

    assert.equal(Settings.shouldHidePassword(), true);
    assert.equal(Settings.storeLocation, "memory");
});

QUnit.module("rdf export", {
    setup: function() {
        Settings.loadProfiles();
        this.rdf_doc1 = RdfImporter.loadDoc($("#rdf1").val());
        RdfImporter.saveProfiles(this.rdf_doc1.profiles);
        this.doc2 = RdfImporter.loadDoc(RdfImporter.dumpDoc());
    },
    teardown: function() {
        Settings.profiles = [];
        localStorage.clear();
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
    setup: function() {
        Settings.loadProfiles();
        this.p = Settings.profiles[0];
        this.url = "http://www.passwordmaker.org/";
        this.pass = "i♥passwordMaker©";
    },
    teardown: function() {
        Settings.profiles = [];
        localStorage.clear();
    }
});

QUnit.test("algorithms", function(assert) {
    this.p.hashAlgorithm = "md4";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Qm4kQn10bSw=", "MD4 variant");
    this.p.hashAlgorithm = "hmac-md4";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "R2hwJUFmYFw=", "HMAC-MD4 variant");
    this.p.hashAlgorithm = "md5";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "SEUxMmc/b0c=", "MD5 variant");
    this.p.hashAlgorithm = "md5_v6";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "NWFiNTlmMzk=", "MD5 Version 0.6 variant");
    this.p.hashAlgorithm = "hmac-md5";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "dH5fd1hcJnQ=", "HMAC-MD5 variant");
    this.p.hashAlgorithm = "hmac-md5_v6";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "OGUzMGJhZTA=", "HMAC-MD5 Version 0.6 variant");
    this.p.hashAlgorithm = "sha1";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "Rn4vcGIuQGE=", "SHA-1 variant");
    this.p.hashAlgorithm = "hmac-sha1";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "NTJxZklgPn0=", "HMAC-SHA-1 variant");
    this.p.hashAlgorithm = "sha256";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "TzA5Qlp9PT4=", "SHA-256 variant");
    this.p.hashAlgorithm = "hmac-sha256_fix";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "OW9QUzdQPnU=", "HMAC-SHA-256 variant");
    this.p.hashAlgorithm = "hmac-sha256";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "VlFDa0E/Qyg=", "HMAC-SHA-256 Version 1.5.1 variant");
    this.p.hashAlgorithm = "rmd160";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "R21MWT17dCc=", "RIPEMD-160 variant");
    this.p.hashAlgorithm = "hmac-rmd160";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "KE0+Tk1WVyM=", "HMAC-RIPEMD-160 variant");
    this.p.l33tLevel = 9;
    this.p.hashAlgorithm = "md5";
    this.p.whereToUseL33t = "before-hashing";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "SzpLelh4I1c=", "Before L33t variant");
    this.p.whereToUseL33t = "after-hashing";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "fC18JjEyNj8=", "After L33t variant");
    this.p.whereToUseL33t = "both";
    assert.equal(btoa(this.p.getPassword(this.url, this.pass)), "fHs6fHsiL18=", "Befor & After L33t variant");
});
