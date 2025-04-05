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
    var map = new Map();
    list.forEach((item) => {
        map.set(item[0], item[1]);
        map.set(item[1], item[0]);
    });
    return map.get(key) || key;
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
        ["profile", "timestamp",             "timestamp",          parseInt],
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
        ["profile", "description",           "description"],
        ["default", "protocolCB",            "url_protocol",       strToBool],
        ["default", "subdomainCB",           "url_subdomain",      strToBool],
        ["default", "domainCB",              "url_domain",         strToBool],
        ["default", "pathCB",                "url_path",           strToBool]
    ],

    // use FF as key for lookup
    getImportOpts: function() {
        var rv = new Map();
        this.attrs.forEach((attr) => {
            rv.set(attr[1], {
                name: attr[2],
                convert: attr[3]
            });
        });
        return rv;
    },

    // use option group as key for separate lists
    getExportOpts: function() {
        var rv = {};
        this.attrs.forEach((attr) => {
            var k = attr[0];
            if (!rv[k]) {
                rv[k] = [];
            }
            rv[k].push({
                to: attr[1],
                from: attr[2],
                convert: attr[4]
            });
        });
        return rv;
    }
};

RdfImporter.loadDoc = (rdf) => {
    var profiles = [],
        defaultProfile = {},
        settings = {};

    // check over every Description, but will ignore groups and anything without
    // settings/profile attributes
    Array.from(new DOMParser().parseFromString(rdf, "text/xml").getElementsByTagName("RDF:Description")).forEach((item) => {
        var prof = {};
        var attrMap = RdfImporter.getImportOpts(item);
        var attrName = "";
        Array.from(item.attributes).forEach((attr) => {
            // remove namespace
            attrName = attr.localName;
            var opts = attrMap.get(attrName);
            var val = attr.value;
            if (opts) {
                prof[opts.name] = opts.convert ? opts.convert(val) : val;
            }
        });

        // deal with the cases that there are multiple lines in the description
        var descr = item.getElementsByTagName("NS1:description")[0];
        if (descr) {
            prof.description = descr.textContent;
        }

        // store site patterns
        var patterns = [],
            patternType = [],
            patternEnabled = [],
            siteList = "";
        Array.from(item.attributes).forEach((attr) => {
            attrName = attr.localName;
            var m = attrName.match(/pattern(|type|enabled)(\d+)/);
            if (m) {
                switch (m[1]) {
                    case "":
                        patterns[m[2]] = attr.value;
                        break;
                    case "type":
                        patternType[m[2]] = attr.value;
                        break;
                    case "enabled":
                        patternEnabled[m[2]] = attr.value;
                        break;
                }
            }
        });

        patterns.forEach((pat, k) => {
            if (patternEnabled[k] === "true") {
                if (patternType[k] === "regex") {
                    siteList += "/" + pat + "/ ";
                } else {
                    siteList += pat + " ";
                }
            }
        });

        prof.siteList = siteList.trim();

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
    var fromChrome = rdf.includes("http://passwordmaker.mozdev.org/remotes");

    // chrome -> chrome doesn't need "default" profile. would create duplicate.
    if (fromChrome) {
        profiles.unshift(defaultProfile);
        // FF version uses a "default" profile that has attributes we need for each
        // profile (such as url_{protocol,subdomain,domain,path})
        profiles.forEach((profile, i) => {
            profiles[i] = Object.assign(new Profile(), defaultProfile, profile);
        });
    }

    return {
        settings: settings,
        profiles: profiles
    };
};

// returns number of profiles imported
RdfImporter.saveProfiles = (profiles) => {
    if (!profiles || !profiles.length) {
        return 0;
    }
    profiles.forEach((profile) => {
        Settings.addProfile(Object.assign(new Profile(), profile));
    });
    Settings.saveProfiles();
    return profiles.length;
};

RdfImporter.dumpDoc = () => {
    var rv = `<?xml version="1.0"?>
<RDF:RDF xmlns:NS1="http://passwordmaker.mozdev.org/rdf#"
         xmlns:NC="http://home.netscape.com/NC-rdf#"
         xmlns:RDF="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`;
    rv += dumpedProfilesToRdf(dumpedProfiles());
    rv += `</RDF:RDF>`;
    return rv;
};

// get profiles as list of objects w/ FF names as keys
function dumpedProfiles() {
    var dumpProfiles = [],
        expOpts = RdfImporter.getExportOpts(this);

    Settings.loadProfiles();

    Settings.profiles.forEach((prof) => {
        var newProf = {},
            attrMap = expOpts.profile.concat(expOpts["default"]);

        // regular attributes
        attrMap.forEach((opts) => {
            var val = prof[opts.from];
            newProf[opts.to] = opts.convert ? opts.convert(val) : val;
        });

        // patterns
        if (prof.siteList) {
            var pats = prof.siteList.trim().split(/\s+/);
            pats.forEach((pat, k) => {
                var ptype = (pat.startsWith("/") && pat.endsWith("/")) ? "regex" : "wildcard";
                newProf["pattern" + k] = (ptype === "regex") ? pat.slice(1, -1) : pat;
                newProf["patternenabled" + k] = "true";
                newProf["patterndesc" + k] = "";
                newProf["patterntype" + k] = ptype;
            });
        }
        dumpProfiles.push(newProf);
    });
    chrome.storage.local.get(["sort_profiles"]).then((result) => {
        Settings.sortProfiles(result["sort_profiles"]);
    });

    return dumpProfiles;
}

function dumpedProfilesToRdf(profiles) {
    var rv = "",
        abouts = [];
    // use first as defaults profile, necessary for FF
    profiles.unshift(Object.assign({}, profiles[0], {
        name: "Defaults"
    }));
    var rvbool = false; // true if multiple-line description exists
    profiles.forEach((prof, i) => {
        var about = (i === 0) ? "http://passwordmaker.mozdev.org/defaults" : "rdf:#$CHROME" + i;
        abouts.push(about);
        rv += `<RDF:Description RDF:about="${attrEscape(about)}"\n`;
        for (let [key, value] of Object.entries(prof)) {
            if ( /\n/.exec(value) ) {
                rvbool = true;
            } else {
                rv += ` NS1:${key}="${attrEscape(value)}"\n`;
            }
        }
        // import multiple-line description if it exists
        if (rvbool) {
            rv += ` >\n`;
            for (let [key, value] of Object.entries(prof)) {
                if ( /\n/.exec(value) ) {
                    rv += ` <NS1:${key}>${attrEscape(value)}</NS1:${key}>\n`;
                }
            }
            rv += ` </RDF:Description>\n`;
        } else {
            rv += ` />\n`;
        }
    });
    rv += `<RDF:Seq RDF:about="http://passwordmaker.mozdev.org/accounts">\n`;
    abouts.forEach((item) => {
        rv += `<RDF:li RDF:resource="${attrEscape(item)}"/>\n`;
    });
    rv += "</RDF:Seq>";

    return rv;
}

function attrEscape(txt) {
    return String(txt).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}
