QUnit.testStart = function () {
    localStorage.clear();
}

module("rdf import");

var rdf_doc1 = RdfImporter.loadDoc($($('#rdf1').val()));

test("parse global settings", function () {
    var s = rdf_doc1.settings;

    same(s.rdf_about, 'http://passwordmaker.mozdev.org/globalSettings');
    same(s.hideMasterPassword, false);
    same(s.storeLocation, 'memory');
});

test("find profiles", function () {
    same(rdf_doc1.profiles.length, 2);
});

test("load profile 1", function () {
    var p = rdf_doc1.profiles[0];

    same(p.rdf_about, 'rdf:#$5PGpU1');
    same(p.title,'nospecial');
    same(p.url_protocol, false);
    same(p.url_subdomain, false);
    same(p.url_domain, true);
    same(p.url_path, true);
    same(p.hashAlgorithm, 'hmac-sha256_fix');
    same(p.username, 'username1');
    same(p.modifier, 'modifier1');
    same(p.passwordLength, 20);
    same(p.selectedCharset, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    same(p.passwordPrefix, 'prefix1');
    same(p.passwordSuffix, 'suffix1');
    same(p.whereToUseL33t, 'before-hashing');
    same(p.l33tLevel, 1);
});

test("load profile 2", function () {
    var p = rdf_doc1.profiles[1];

    same(p.rdf_about, 'http://passwordmaker.mozdev.org/defaults');
    same(p.title,'Defaults');
    same(p.url_protocol, false);
    same(p.url_subdomain, false);
    same(p.url_domain, true);
    same(p.url_path, true);
    same(p.hashAlgorithm, 'sha256');
    same(p.username, 'username1');
    same(p.modifier, 'modifier1');
    same(p.passwordLength, 15);
    same(p.selectedCharset, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%');
    same(p.passwordPrefix, 'prefix1');
    same(p.passwordSuffix, 'suffix1');
    same(p.whereToUseL33t, 'off');
    same(p.l33tLevel, 1);
});

test("save profiles", function () {
    var profiles = rdf_doc1.profiles;

    same(profiles.length, 2);
    same(Settings.getProfiles().length, 1);

    RdfImporter.saveProfiles(profiles);

    same(Settings.getProfiles().length, 3);
});

test("save settings", function () {
    var settings = rdf_doc1.settings;

    Settings.setHidePassword(false);
    Settings.setStoreLocation('disk');

    same(Settings.shouldHidePassword(), false);
    same(Settings.storeLocation, 'disk');

    RdfImporter.saveSettings({hideMasterPassword: true, storeLocation: 'memory'});

    same(Settings.shouldHidePassword(), true);
    same(Settings.storeLocation, 'memory');
});
