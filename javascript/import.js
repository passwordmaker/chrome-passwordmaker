function strToBool(v) {
    return v.toString() === 'true';
}

var RdfImporter = {
    attrMap: {
        about: {
            name: 'rdf_about',
        },

        // Settings
        // TODO? master password
        maskmasterpassword: {
            name: 'hideMasterPassword',
            convert: strToBool,
        },
        masterpasswordstorage: {
            name: 'storeLocation',
            convert: function (v) { 
                return {'store-on-disk': 'disk', 'store-in-memory': 'memory'}[v];
            },
        },

        // Profiles
        name: {
            name: 'title',
        },
        whereleetlb: {
            name: 'whereToUseL33t',
        },
        leetlevellb: {
            name: 'l33tLevel',
            convert: parseInt,
        },
        hashalgorithmlb: {
            name: 'hashAlgorithm',
            convert: function (v) { 
                // rest of the names are the same
                return {'hmac-sha256-fixed': 'hmac-sha256_fix',
                        'md5-v0.6': 'md5_v6',
                        'hmac-md5-v0.6': 'hmac-md5_v6'}[v] || v;
            },
        },
        passwordlength: {
            name: 'passwordLength',
            convert: parseInt,
        },
        usernametb: {
            name: 'username',
        },
        counter: {
            name: 'modifier',
        },
        charset: {
            name: 'selectedCharset',
        },
        prefix: {
            name: 'passwordPrefix',
        },
        suffix: {
            name: 'passwordSuffix',
        },
        protocolcb: {
            name: 'url_protocol',
            convert: strToBool,
        },
        subdomaincb: {
            name: 'url_subdomain',
            convert: strToBool,
        },
        domaincb: {
            name: 'url_domain',
            convert: strToBool,
        },
        pathcb: {
            name: 'url_path',
            convert: strToBool,
        },
    }
}

RdfImporter.loadDoc = function(rdf) {
    var profiles = [],
        defaultProfile = {},
        settings = {},
        that = this;
    // check over every Description, but will ignore groups and anything without
    // settings/profile attributes
    $(rdf).find('RDF\\:Description').each(function(){
        var prof = {};
        for(var i=0;i<this.attributes.length;i++){
            // remove namespace
            var attrName = this.attributes[i].name.replace(/.*:/g,''),
                opts = RdfImporter.attrMap[attrName],
                val = this.attributes[i].value;
            if(opts){
                prof[opts.name] = opts.convert ? opts.convert(val) : val;
            }
        }
        if(prof.rdf_about == 'http://passwordmaker.mozdev.org/globalSettings'){
            settings = prof;
        }else if(prof.selectedCharset){
            if(prof.rdf_about == 'http://passwordmaker.mozdev.org/defaults'){
                defaultProfile = prof;
            }
            profiles.push(prof);
        }
    });

    // FF version uses a "default" profile that has attributes we need for each
    // profile (such as url_{protocol,subdomain,domain,path})
    for(var i=0;i<profiles.length;i++){
        profiles[i] = $.extend(new Profile(), defaultProfile, profiles[i]);
    }

    return {settings: settings, profiles: profiles};
}

// returns number of profiles imported
RdfImporter.saveProfiles = function(profiles) {
    if(!profiles || !profiles.length) return 0;
    for(var i=0;i<profiles.length;i++){
        Settings.addProfile(profiles[i]);
    }
    Settings.saveProfiles();
    return profiles.length;
}

RdfImporter.saveSettings = function(settings) {
    Settings.setHidePassword(settings.hideMasterPassword);
    Settings.setStoreLocation(settings.storeLocation);
}
