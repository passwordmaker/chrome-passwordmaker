module("rdf import");

var rdf_doc1 = null;
QUnit.testStart = function() {
    localStorage.clear();
    Settings.profiles = [];
    rdf_doc1 = RdfImporter.loadDoc($("#rdf1").val());
};

test("parse global settings", function() {
    var s = rdf_doc1.settings;

    deepEqual(s.rdf_about, "http://passwordmaker.mozdev.org/globalSettings");
    deepEqual(s.hideMasterPassword, false);
    deepEqual(s.storeLocation, "memory");
});

test("find profiles", function() {
    deepEqual(rdf_doc1.profiles.length, 2);
});

test("load profile", function() {
    var p = rdf_doc1.profiles[1];

    deepEqual(p.rdf_about, "rdf:#$5PGpU1");
    deepEqual(p.title, "nospecial");
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, "hmac-sha256_fix");
    deepEqual(p.username, "username1");
    deepEqual(p.modifier, "modifier1");
    deepEqual(p.passwordLength, 20);
    deepEqual(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
    deepEqual(p.passwordPrefix, "prefix1");
    deepEqual(p.passwordSuffix, "suffix1");
    deepEqual(p.whereToUseL33t, "before-hashing");
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, "/https?://mail\\.yahoo\\.com/.*/ http?://github.com/*");
});

test("load default profile", function() {
    var p = rdf_doc1.profiles[0];

    deepEqual(p.rdf_about, "http://passwordmaker.mozdev.org/defaults");
    deepEqual(p.title, "Defaults");
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, "sha256");
    deepEqual(p.username, "username1");
    deepEqual(p.modifier, "modifier1");
    deepEqual(p.passwordLength, 15);
    deepEqual(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%");
    deepEqual(p.passwordPrefix, "prefix1");
    deepEqual(p.passwordSuffix, "suffix1");
    deepEqual(p.whereToUseL33t, "off");
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, "");
});

test("save profiles", function() {
    var profiles = rdf_doc1.profiles;

    deepEqual(profiles.length, 2);
    Settings.loadProfiles();
    deepEqual(Settings.profiles.length, 2);

    RdfImporter.saveProfiles(profiles);

    deepEqual(Settings.profiles.length, 4);
});

test("save settings", function() {
    localStorage.setItem("show_generated_password", true);
    Settings.setStoreLocation("memory");

    deepEqual(Settings.shouldHidePassword(), true);
    deepEqual(Settings.storeLocation, "memory");
});

module("rdf export");

test("dump profile to rdf", function() {
    Settings.loadProfiles();
    RdfImporter.saveProfiles(rdf_doc1.profiles);
    deepEqual(Settings.profiles.length, 4);
    var doc2 = RdfImporter.loadDoc(RdfImporter.dumpDoc());

    var p = doc2.profiles[3];
    deepEqual(p.rdf_about, "rdf:#$CHROME4");
    deepEqual(p.title, "nospecial");
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, "hmac-sha256_fix");
    deepEqual(p.username, "username1");
    deepEqual(p.modifier, "modifier1");
    deepEqual(p.passwordLength, 20);
    deepEqual(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
    deepEqual(p.passwordPrefix, "prefix1");
    deepEqual(p.passwordSuffix, "suffix1");
    deepEqual(p.whereToUseL33t, "before-hashing");
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, "/https?://mail\\.yahoo\\.com/.*/ http?://github.com/*");
});

test("dump default profile to rdf", function() {
    Settings.loadProfiles();
    RdfImporter.saveProfiles(rdf_doc1.profiles);
    deepEqual(Settings.profiles.length, 4);
    var doc2 = RdfImporter.loadDoc(RdfImporter.dumpDoc());

    var p = doc2.profiles[2];

    deepEqual(p.rdf_about, "rdf:#$CHROME3");
    deepEqual(p.title, "Defaults");
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, "sha256");
    deepEqual(p.username, "username1");
    deepEqual(p.modifier, "modifier1");
    deepEqual(p.passwordLength, 15);
    deepEqual(p.selectedCharset, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%");
    deepEqual(p.passwordPrefix, "prefix1");
    deepEqual(p.passwordSuffix, "suffix1");
    deepEqual(p.whereToUseL33t, "off");
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, "");
});

module("password generation");

test("algorithms", function() {
    Settings.loadProfiles();
    var p = Settings.profiles[0];
    var url = "http://www.passwordmaker.org/";
    var pass = "i♥passwordMaker©";
    p.hashAlgorithm = "md4";
    deepEqual(btoa(p.getPassword(url, pass)), "Qm4kQn10bSw=", "MD4 variant");
    p.hashAlgorithm = "hmac-md4";
    deepEqual(btoa(p.getPassword(url, pass)), "R2hwJUFmYFw=", "HMAC-MD4 variant");
    p.hashAlgorithm = "md5";
    deepEqual(btoa(p.getPassword(url, pass)), "SEUxMmc/b0c=", "MD5 variant");
    p.hashAlgorithm = "md5_v6";
    deepEqual(btoa(p.getPassword(url, pass)), "NWFiNTlmMzk=", "MD5 Version 0.6 variant");
    p.hashAlgorithm = "hmac-md5";
    deepEqual(btoa(p.getPassword(url, pass)), "dH5fd1hcJnQ=", "HMAC-MD5 variant");
    p.hashAlgorithm = "hmac-md5_v6";
    deepEqual(btoa(p.getPassword(url, pass)), "OGUzMGJhZTA=", "HMAC-MD5 Version 0.6 variant");
    p.hashAlgorithm = "sha1";
    deepEqual(btoa(p.getPassword(url, pass)), "Rn4vcGIuQGE=", "SHA-1 variant");
    p.hashAlgorithm = "hmac-sha1";
    deepEqual(btoa(p.getPassword(url, pass)), "NTJxZklgPn0=", "HMAC-SHA-1 variant");
    p.hashAlgorithm = "sha256";
    deepEqual(btoa(p.getPassword(url, pass)), "TzA5Qlp9PT4=", "SHA-256 variant");
    p.hashAlgorithm = "hmac-sha256_fix";
    deepEqual(btoa(p.getPassword(url, pass)), "OW9QUzdQPnU=", "HMAC-SHA-256 variant");
    p.hashAlgorithm = "hmac-sha256";
    deepEqual(btoa(p.getPassword(url, pass)), "VlFDa0E/Qyg=", "HMAC-SHA-256 Version 1.5.1 variant");
    p.hashAlgorithm = "rmd160";
    deepEqual(btoa(p.getPassword(url, pass)), "R21MWT17dCc=", "RIPEMD-160 variant");
    p.hashAlgorithm = "hmac-rmd160";
    deepEqual(btoa(p.getPassword(url, pass)), "KE0+Tk1WVyM=", "HMAC-RIPEMD-160 variant");
    p.l33tLevel = 9;
    p.hashAlgorithm = "md5";
    p.whereToUseL33t = "before-hashing";
    deepEqual(btoa(p.getPassword(url, pass)), "SzpLelh4I1c=", "Before L33t variant");
    p.whereToUseL33t = "after-hashing";
    deepEqual(btoa(p.getPassword(url, pass)), "fC18JjEyNj8=", "After L33t variant");
    p.whereToUseL33t = "both";
    deepEqual(btoa(p.getPassword(url, pass)), "fHs6fHsiL18=", "Befor & After L33t variant");
});
