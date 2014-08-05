module("rdf import");

var rdf_doc1 = null;
QUnit.testStart = function () {
    localStorage.clear();
    Settings.profiles = [];
    rdf_doc1 = RdfImporter.loadDoc($('#rdf1').val());
};

test("parse global settings", function () {
    var s = rdf_doc1.settings;

    deepEqual(s.rdf_about, 'http://passwordmaker.mozdev.org/globalSettings');
    deepEqual(s.hideMasterPassword, false);
    deepEqual(s.storeLocation, 'memory');
});

test("find profiles", function () {
    deepEqual(rdf_doc1.profiles.length, 2);
});

test("load profile", function () {
    var p = rdf_doc1.profiles[1];

    deepEqual(p.rdf_about, 'rdf:#$5PGpU1');
    deepEqual(p.title,'nospecial');
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, 'hmac-sha256_fix');
    deepEqual(p.username, 'username1');
    deepEqual(p.modifier, 'modifier1');
    deepEqual(p.passwordLength, 20);
    deepEqual(p.selectedCharset, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    deepEqual(p.passwordPrefix, 'prefix1');
    deepEqual(p.passwordSuffix, 'suffix1');
    deepEqual(p.whereToUseL33t, 'before-hashing');
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, '/https?://mail\\.yahoo\\.com/.*/ http?://github.com/* ');
});

test("load default profile", function () {
    var p = rdf_doc1.profiles[0];

    deepEqual(p.rdf_about, 'http://passwordmaker.mozdev.org/defaults');
    deepEqual(p.title,'Defaults');
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, 'sha256');
    deepEqual(p.username, 'username1');
    deepEqual(p.modifier, 'modifier1');
    deepEqual(p.passwordLength, 15);
    deepEqual(p.selectedCharset, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%');
    deepEqual(p.passwordPrefix, 'prefix1');
    deepEqual(p.passwordSuffix, 'suffix1');
    deepEqual(p.whereToUseL33t, 'off');
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, '');
});

test("save profiles", function () {
    var profiles = rdf_doc1.profiles;

    deepEqual(profiles.length, 2);
    Settings.loadProfiles();
    deepEqual(Settings.profiles.length, 2);

    RdfImporter.saveProfiles(profiles);

    deepEqual(Settings.profiles.length, 4);
});

test("save settings", function () {
    localStorage.setItem("show_generated_password", true);
    Settings.setStoreLocation('memory');

    deepEqual(Settings.shouldHidePassword(), true);
    deepEqual(Settings.storeLocation, 'memory');
});

module("rdf export");

test("dump profile to rdf", function () {
    Settings.loadProfiles();
    RdfImporter.saveProfiles(rdf_doc1.profiles);
    deepEqual(Settings.profiles.length, 4);
    var doc2 = RdfImporter.loadDoc(RdfImporter.dumpDoc());

    var p = doc2.profiles[3];
    deepEqual(p.rdf_about, 'rdf:#$CHROME4');
    deepEqual(p.title,'nospecial');
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, 'hmac-sha256_fix');
    deepEqual(p.username, 'username1');
    deepEqual(p.modifier, 'modifier1');
    deepEqual(p.passwordLength, 20);
    deepEqual(p.selectedCharset, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    deepEqual(p.passwordPrefix, 'prefix1');
    deepEqual(p.passwordSuffix, 'suffix1');
    deepEqual(p.whereToUseL33t, 'before-hashing');
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, '/https?://mail\\.yahoo\\.com/.*/ http?://github.com/* ');
});

test("dump defaults profile to rdf", function () {
    Settings.loadProfiles();
    RdfImporter.saveProfiles(rdf_doc1.profiles);
    deepEqual(Settings.profiles.length, 4);
    var doc2 = RdfImporter.loadDoc(RdfImporter.dumpDoc());

    var p = doc2.profiles[2];

    deepEqual(p.rdf_about, 'rdf:#$CHROME3');
    deepEqual(p.title,'Defaults');
    deepEqual(p.url_protocol, false);
    deepEqual(p.url_subdomain, false);
    deepEqual(p.url_domain, true);
    deepEqual(p.url_path, true);
    deepEqual(p.hashAlgorithm, 'sha256');
    deepEqual(p.username, 'username1');
    deepEqual(p.modifier, 'modifier1');
    deepEqual(p.passwordLength, 15);
    deepEqual(p.selectedCharset, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%');
    deepEqual(p.passwordPrefix, 'prefix1');
    deepEqual(p.passwordSuffix, 'suffix1');
    deepEqual(p.whereToUseL33t, 'off');
    deepEqual(p.l33tLevel, 1);
    deepEqual(p.siteList, '');
});
