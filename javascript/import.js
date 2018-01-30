/*
 * Importing RDF from Chrome and FF:
 *
 * var loadedData = RdfImporter.loadDoc(rdfString);
 * var profiles = loadedData.profiles; // list of profiles
 *
 * var saveCount = RdfImporter.saveProfiles(profiles); // number of profiles saved
 *
 * Exporting to RDF:
 *
 * var dumpedString = RdfImporter.dumpDoc();
 * console.log(dumpedString); // <?xml ...
 *
 * NOTE: the Firefox RDF has additional settings that are ignored on import
 * (groups, upload/download settings, etc.).
 */

function strToBool(v) {
    return (/true/i).test(v);
}

// rename "store-on-disk" -> "disk" or vice versa
function renameStoreLocation(key) {
    return renameImportMap(key, RdfImporter.storeLocations);
}

// rename "md5-v0.6" -> "md5_v6" or vice versa
function renameHashAlgorithm(key) {
    return renameImportMap(key, RdfImporter.hashAlgorithms);
}

function renameImportMap(key, list) {
    var map = {};
    for (var i = 0; i < list.length; i++) {
        map[list[i][0]] = list[i][1];
        map[list[i][1]] = list[i][0];
    }
    return map[key] || key;
}

var RdfImporter = {
    // [FF, Chrome]
    storeLocations: [
        ["store-on-disk",   "disk"],
        ["store-in-memory", "memory"]
    ],

    // [FF, Chrome]
    hashAlgorithms: [
        ["hmac-sha256-fixed", "hmac-sha256_fix"],
        ["md5-v0.6",          "md5_v6"],
        ["hmac-md5-v0.6",     "hmac-md5_v6"]
    ],

    // [Group, FF, Chrome, import conversion function, export conversion function]
    attrs: [
        ["all",     "about",                 "rdf_about"],
        ["setting", "maskMasterPassword",    "hideMasterPassword", strToBool],
        ["setting", "masterPasswordStorage", "storeLocation",      renameStoreLocation, renameStoreLocation],
        ["profile", "name",                  "title"],
        ["profile", "urlToUse",              "strUseText"],
        ["profile", "whereLeetLB",           "whereToUseL33t"],
        ["profile", "leetLevelLB",           "l33tLevel",          parseInt],
        ["profile", "hashAlgorithmLB",       "hashAlgorithm",      renameHashAlgorithm, renameHashAlgorithm],
        ["profile", "passwordLength",        "passwordLength",     parseInt],
        ["profile", "usernameTB",            "username"],
        ["profile", "counter",               "modifier"],
        ["profile", "charset",               "selectedCharset"],
        ["profile", "prefix",                "passwordPrefix"],
        ["profile", "suffix",                "passwordSuffix"],
        ["default", "protocolCB",            "url_protocol",       strToBool],
        ["default", "subdomainCB",           "url_subdomain",      strToBool],
        ["default", "domainCB",              "url_domain",         strToBool],
        ["default", "pathCB",                "url_path",           strToBool]
    ],

    // use FF as key for lookup
    getImportOpts: function() {
        var rv = {};
        for (var i = 0; i < this.attrs.length; i++) {
            rv[this.attrs[i][1].toLowerCase()] = {
                name: this.attrs[i][2],
                convert: this.attrs[i][3]
            };
        }
        return rv;
    },

    // use option group as key for separate lists
    getExportOpts: function() {
        var rv = {};
        for (var i = 0; i < this.attrs.length; i++) {
            var k = this.attrs[i][0];
            if (!rv[k]) {
                rv[k] = [];
            }
            rv[k].push({
                to: this.attrs[i][1],
                from: this.attrs[i][2],
                convert: this.attrs[i][4]
            });
        }
        return rv;
    }
};

RdfImporter.loadDoc = function(rdf) {
    var profiles = [],
        defaultProfile = {},
        settings = {};

    // check over every Description, but will ignore groups and anything without
    // settings/profile attributes
    $(rdf).find("RDF\\:Description").each(function() {
        var prof = {},
            attrMap = RdfImporter.getImportOpts(),
            attrName = "";
        for (var i = 0; i < this.attributes.length; i++) {
            // remove namespace
            attrName = this.attributes[i].name.replace(/\w+:/, "");
            var opts = attrMap[attrName],
                val = this.attributes[i].value;
            if (opts) {
                prof[opts.name] = opts.convert ? opts.convert(val) : val;
            }
        }

        // store site patterns
        var patterns = [],
            patternType = [],
            patternEnabled = [],
            siteList = "",
            siteListType = "wildcard";

        for (var j = 0; j < this.attributes.length; j++) {
            attrName = this.attributes[j].name.replace(/\w+:/, "");
            var m = attrName.match(/pattern(|type|enabled)(\d+)/);
            if (m) {
                if (m[1] === "") {
                    patterns[m[2]] = this.attributes[j].value;
                } else if (m[1] === "type") {
                    patternType[m[2]] = this.attributes[j].value;
                } else if (m[1] === "enabled") {
                    patternEnabled[m[2]] = this.attributes[j].value;
                }
            }
        }
        for (var k = 0; k < patterns.length; k++) {
            if (patternEnabled[k] === "true") {
                siteList += patterns[k] + " ";
                siteListType = patternType[k];
            }
        }
        prof.siteList = siteList.trim();
        prof.siteListType = siteListType;

        if (prof.rdf_about === "http://passwordmaker.mozdev.org/globalSettings") {
            settings = prof;
        } else if (prof.selectedCharset) {
            if (prof.rdf_about === "http://passwordmaker.mozdev.org/defaults") {
                defaultProfile = prof;
            } else {
                profiles.push(prof);
            }
        }
    });

    // chrome export doesn't include /remotes section.
    var fromChrome = rdf.indexOf("http://passwordmaker.mozdev.org/remotes") === -1;

    // chrome -> chrome doesn't need "default" profile. would create duplicate.
    if (!fromChrome) {
        profiles.unshift(defaultProfile);
        // FF version uses a "default" profile that has attributes we need for each
        // profile (such as url_{protocol,subdomain,domain,path})
        for (var i = 0; i < profiles.length; i++) {
            profiles[i] = $.extend(Object.create(Profile), defaultProfile, profiles[i]);
        }
    }

    return {
        settings: settings,
        profiles: profiles
    };
};

// returns number of profiles imported
RdfImporter.saveProfiles = function(profiles) {
    if (!profiles || !profiles.length) {
        return 0;
    }
    for (var i = 0; i < profiles.length; i++) {
        Settings.addProfile($.extend(Object.create(Profile), profiles[i]));
    }
    Settings.saveProfiles();
    return profiles.length;
};

RdfImporter.dumpDoc = function() {
    var rv = "<?xml version=\"1.0\"?>\n" +
             "<RDF:RDF xmlns:NS1=\"http://passwordmaker.mozdev.org/rdf#\"\n" +
             "         xmlns:NC=\"http://home.netscape.com/NC-rdf#\"\n" +
             "         xmlns:RDF=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">\n";
    rv += dumpedProfilesToRdf(dumpedProfiles());
    rv +=    "</RDF:RDF>\n";
    return rv;
};

// get profiles as list of objects w/ FF names as keys
function dumpedProfiles() {
    var dumpProfiles = [],
        expOpts = RdfImporter.getExportOpts();

    for (var i = 0; i < Settings.profiles.length; i++) {
        var prof = Settings.profiles[i],
            newProf = {},
            attrMap = expOpts.profile.concat(expOpts["default"]);

        // regular attributes
        for (var j = 0; j < attrMap.length; j++) {
            var opts = attrMap[j],
                val = prof[opts.from];
            newProf[opts.to] = opts.convert ? opts.convert(val) : val;
        }

        // patterns
        if (prof.siteList) {
            var pats = prof.siteList.trim().split(/\s+/);
            for (var k = 0; k < pats.length; k++) {
                var pat = pats[k],
                    ptype = prof.siteListType || ((pat[0] === "/" && pat[pat.length - 1] === "/") ? "regex" : "wildcard");

                newProf["pattern" + k] = pat.replace(/^\/|\/$/g, '');
                newProf["patternenabled" + k] = "true";
                newProf["patterndesc" + k] = "";
                newProf["patterntype" + k] = ptype;
            }
        }
        dumpProfiles.push(newProf);
    }
    return dumpProfiles;
}

function dumpedProfilesToRdf(profiles) {
    var rv = "",
        abouts = [];
    // use first as defaults profile, necessary for FF
    profiles.unshift($.extend({}, profiles[0], {
        name: "Defaults"
    }));
    for (var i = 0; i < profiles.length; i++) {
        var about = (i === 0) ? "http://passwordmaker.mozdev.org/defaults" : "rdf:#$CHROME" + i;
        abouts.push(about);
        rv += "<RDF:Description RDF:about=\"" + attrEscape(about) + "\"\n";
        var keys = Object.keys(profiles[i]);
        for (var j = 0; j < keys.length; j++) {
            rv += " NS1:" + keys[j] + "=\"" + attrEscape(profiles[i][keys[j]]) + "\"\n ";
        }
        rv += " />\n";
    }
    rv += "<RDF:Seq RDF:about=\"http://passwordmaker.mozdev.org/accounts\">\n";
    for (var k = 0; k < abouts.length; k++) {
        rv += "<RDF:li RDF:resource=\"" + attrEscape(abouts[k]) + "\"/>\n";
    }
    rv += "</RDF:Seq>\n";

    return rv;
}

function attrEscape(txt) {
    return String(txt).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&#39;");
}
