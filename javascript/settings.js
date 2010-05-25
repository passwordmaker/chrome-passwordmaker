var Settings = {
    activeProfileId : localStorage["profile_id"],
    storeLocation: localStorage["store_location"],
    password: "",
    profiles: null
};

// List of top-level domains, parsed from domains.rdf from the PasswordMaker
// Firefox version.
var TOPLEVELDOMAINS = {
  "aland.fi":1, "wa.edu.au":1, "nsw.edu.au":1, "vic.edu.au":1, "csiro.au":1,
  "conf.au":1, "info.au":1, "oz.au":1, "telememo.au":1, "sa.edu.au":1,
  "nt.edu.au":1, "tas.edu.au":1, "act.edu.au":1, "wa.gov.au":1, "nsw.gov.au":1,
  "vic.gov.au":1, "qld.gov.au":1, "sa.gov.au":1, "tas.gov.au":1, "nt.gov.au":1,
  "act.gov.au":1, "archie.au":1, "edu.au":1, "gov.au":1, "id.au":1, "org.au":1,
  "asn.au":1, "net.au":1, "com.au":1, "qld.edu.au":1, "com.bb":1, "net.bb":1,
  "org.bb":1, "gov.bb":1, "agr.br":1, "am.br":1, "art.br":1, "edu.br":1,
  "com.br":1, "coop.br":1, "esp.br":1, "far.br":1, "fm.br":1, "g12.br":1,
  "gov.br":1, "imb.br":1, "ind.br":1, "inf.br":1, "mil.br":1, "net.br":1,
  "org.br":1, "psi.br":1, "rec.br":1, "srv.br":1, "tmp.br":1, "tur.br":1,
  "tv.br":1, "etc.br":1, "adm.br":1, "adv.br":1, "arq.br":1, "ato.br":1,
  "bio.br":1, "bmd.br":1, "cim.br":1, "cng.br":1, "cnt.br":1, "ecn.br":1,
  "eng.br":1, "eti.br":1, "fnd.br":1, "fot.br":1, "fst.br":1, "ggf.br":1,
  "jor.br":1, "lel.br":1, "mat.br":1, "med.br":1, "mus.br":1, "not.br":1,
  "ntr.br":1, "odo.br":1, "ppg.br":1, "pro.br":1, "psc.br":1, "qsl.br":1,
  "slg.br":1, "trd.br":1, "vet.br":1, "zlg.br":1, "nom.br":1, "ab.ca":1,
  "bc.ca":1, "mb.ca":1, "nb.ca":1, "nf.ca":1, "nl.ca":1, "ns.ca":1, "nt.ca":1,
  "nu.ca":1, "on.ca":1, "pe.ca":1, "qc.ca":1, "sk.ca":1, "yk.ca":1, "com.cd":1,
  "net.cd":1, "org.cd":1, "ac.cn":1, "com.cn":1, "edu.cn":1, "gov.cn":1,
  "net.cn":1, "org.cn":1, "ah.cn":1, "bj.cn":1, "cq.cn":1, "fj.cn":1,
  "gd.cn":1, "gs.cn":1, "gz.cn":1, "gx.cn":1, "ha.cn":1, "hb.cn":1, "he.cn":1,
  "hi.cn":1, "hl.cn":1, "hn.cn":1, "jl.cn":1, "js.cn":1, "jx.cn":1, "ln.cn":1,
  "nm.cn":1, "nx.cn":1, "qh.cn":1, "sc.cn":1, "sd.cn":1, "sh.cn":1, "sn.cn":1,
  "sx.cn":1, "tj.cn":1, "xj.cn":1, "xz.cn":1, "yn.cn":1, "zj.cn":1, "co.ck":1,
  "org.ck":1, "edu.ck":1, "gov.ck":1, "net.ck":1, "ac.cr":1, "co.cr":1,
  "ed.cr":1, "fi.cr":1, "go.cr":1, "or.cr":1, "sa.cr":1, "eu.int":1, "ac.in":1,
  "co.in":1, "edu.in":1, "firm.in":1, "gen.in":1, "gov.in":1, "ind.in":1,
  "mil.in":1, "net.in":1, "org.in":1, "res.in":1, "ac.id":1, "co.id":1,
  "or.id":1, "net.id":1, "web.id":1, "sch.id":1, "go.id":1, "mil.id":1,
  "war.net.id":1, "ac.nz":1, "co.nz":1, "cri.nz":1, "gen.nz":1, "geek.nz":1,
  "govt.nz":1, "iwi.nz":1, "maori.nz":1, "mil.nz":1, "net.nz":1, "org.nz":1,
  "school.nz":1, "aid.pl":1, "agro.pl":1, "atm.pl":1, "auto.pl":1, "biz.pl":1,
  "com.pl":1, "edu.pl":1, "gmina.pl":1, "gsm.pl":1, "info.pl":1, "mail.pl":1,
  "miasta.pl":1, "media.pl":1, "nil.pl":1, "net.pl":1, "nieruchomosci.pl":1,
  "nom.pl":1, "pc.pl":1, "powiat.pl":1, "priv.pl":1, "realestate.pl":1,
  "rel.pl":1, "sex.pl":1, "shop.pl":1, "sklep.pl":1, "sos.pl":1, "szkola.pl":1,
  "targi.pl":1, "tm.pl":1, "tourism.pl":1, "travel.pl":1, "turystyka.pl":1,
  "com.pt":1, "edu.pt":1, "gov.pt":1, "int.pt":1, "net.pt":1, "nome.pt":1,
  "org.pt":1, "publ.pt":1, "com.tw":1, "club.tw":1, "ebiz.tw":1, "game.tw":1,
  "gov.tw":1, "idv.tw":1, "net.tw":1, "org.tw":1, "av.tr":1, "bbs.tr":1,
  "bel.tr":1, "biz.tr":1, "com.tr":1, "dr.tr":1, "edu.tr":1, "gen.tr":1,
  "gov.tr":1, "info.tr":1, "k12.tr":1, "mil.tr":1, "name.tr":1, "net.tr":1,
  "org.tr":1, "pol.tr":1, "tel.tr":1, "web.tr":1, "ac.za":1, "city.za":1,
  "co.za":1, "edu.za":1, "gov.za":1, "law.za":1, "mil.za":1, "nom.za":1,
  "org.za":1, "school.za":1, "alt.za":1, "net.za":1, "ngo.za":1, "tm.za":1,
  "web.za":1, "bourse.za":1, "agric.za":1, "cybernet.za":1, "grondar.za":1,
  "iaccess.za":1, "inca.za":1, "nis.za":1, "olivetti.za":1, "pix.za":1,
  "db.za":1, "imt.za":1, "landesign.za":1, "co.kr":1, "pe.kr":1, "or.kr":1,
  "go.kr":1, "ac.kr":1, "mil.kr":1, "ne.kr":1, "chiyoda.tokyo.jp":1,
  "tcvb.or.jp":1, "ac.jp":1, "ad.jp":1, "co.jp":1, "ed.jp":1, "go.jp":1,
  "gr.jp":1, "lg.jp":1, "ne.jp":1, "or.jp":1, "com.mx":1, "net.mx":1,
  "org.mx":1, "edu.mx":1, "gob.mx":1, "ac.uk":1, "co.uk":1, "gov.uk":1,
  "ltd.uk":1, "me.uk":1, "mod.uk":1, "net.uk":1, "nic.uk":1, "nhs.uk":1,
  "org.uk":1, "plc.uk":1, "police.uk":1, "sch.uk":1, "ak.us":1, "al.us":1,
  "ar.us":1, "az.us":1, "ca.us":1, "co.us":1, "ct.us":1, "dc.us":1, "de.us":1,
  "dni.us":1, "fed.us":1, "fl.us":1, "ga.us":1, "hi.us":1, "ia.us":1,
  "id.us":1, "il.us":1, "in.us":1, "isa.us":1, "kids.us":1, "ks.us":1,
  "ky.us":1, "la.us":1, "ma.us":1, "md.us":1, "me.us":1, "mi.us":1, "mn.us":1,
  "mo.us":1, "ms.us":1, "mt.us":1, "nc.us":1, "nd.us":1, "ne.us":1, "nh.us":1,
  "nj.us":1, "nm.us":1, "nsn.us":1, "nv.us":1, "ny.us":1, "oh.us":1, "ok.us":1,
  "or.us":1, "pa.us":1, "ri.us":1, "sc.us":1, "sd.us":1, "tn.us":1, "tx.us":1,
  "ut.us":1, "vt.us":1, "va.us":1, "wa.us":1, "wi.us":1, "wv.us":1, "wy.us":1,
  "com.ua":1, "edu.ua":1, "gov.ua":1, "net.ua":1, "org.ua":1, "cherkassy.ua":1,
  "chernigov.ua":1, "chernovtsy.ua":1, "ck.ua":1, "cn.ua":1, "crimea.ua":1,
  "cv.ua":1, "dn.ua":1, "dnepropetrovsk.ua":1, "donetsk.ua":1, "dp.ua":1,
  "if.ua":1, "ivano-frankivsk.ua":1, "kh.ua":1, "kharkov.ua":1, "kherson.ua":1,
  "kiev.ua":1, "kirovograd.ua":1, "km.ua":1, "kr.ua":1, "ks.ua":1, "lg.ua":1,
  "lugansk.ua":1, "lutsk.ua":1, "lviv.ua":1, "mk.ua":1, "nikolaev.ua":1,
  "od.ua":1, "odessa.ua":1, "pl.ua":1, "poltava.ua":1, "rovno.ua":1, "rv.ua":1,
  "sebastopol.ua":1, "sumy.ua":1, "te.ua":1, "ternopil.ua":1, "vinnica.ua":1,
  "vn.ua":1, "zaporizhzhe.ua":1, "zp.ua":1, "uz.ua":1, "uzhgorod.ua":1,
  "zhitomir.ua":1, "zt.ua":1, "ac.il":1, "co.il":1, "org.il":1, "net.il":1,
  "k12.il":1, "gov.il":1, "muni.il":1, "idf.il":1, "co.im":1, "org.im":1
}


Settings.getProfiles = function() {
    if (Settings.profiles == null) {
        Settings.loadProfiles();
    }
    
    return Settings.profiles;
}

Settings.getProfile = function(id) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        if (profiles[i].id == id) {
            return profiles[i];
        }
    }
    return null;
}

Settings.getMaxId = function() {
    var maxId = 0;
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        if (profiles[i].id > maxId) {
            maxId = profiles[i].id;
        }
    }
    return maxId;
}

Settings.addProfile = function(profile) {
    if (Settings.profiles == null) {
        Settings.getProfiles();
    }
    
    profile.id = Settings.getMaxId() + 1;
    
    Settings.profiles.push(profile);
}

Settings.deleteProfile = function(profile) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        if (profiles[i].id == profile.id) {
            profiles.splice(i, 1);
            Settings.saveProfiles();
        }
    }
}

Settings.loadProfiles = function() {
    if (localStorage["profiles"] == null || localStorage["profiles"] == "") {
        Settings.profiles = [new Profile()];
    } else {
        try {
            json = JSON.parse(localStorage["profiles"]);

            Settings.profiles = [];
            $.each(json, function(i) {
                p = new Profile();
                $.each(json[i], function(key, value) {
                    p[key] = value; 
                });
                Settings.profiles.push(p);                
            });
        } catch(e) {
            Settings.profiles = [new Profile()];
        }
    }
}

Settings.saveProfiles = function() {
    localStorage["profiles"] = JSON.stringify(Settings.profiles);
}

Settings.getActiveProfileId = function() {
    return Settings.activeProfileId;
}

Settings.setActiveProfileId = function(id) {
    localStorage["profile_id"] = id;
    Settings.activeProfileId = id;
}

Settings.setStoreLocation = function(store) {
    if (Settings.storeLocation != store) {
        Settings.storeLocation = store;
        localStorage["store_location"] = store;
        if (Settings.storeLocation != "disk") {
            localStorage["password"] = "";
        }
        if (Settings.storeLocation != "memory") {
            Settings.password = "";
        }
    }
}

// Make a pseudo-random encryption key... emphasis on *pseudo*
Settings.makeKey = function() {
  var hex = ['0','1','2','3','4','5','6','7','8','9','0','a','b','c','d','e','f'];
  var keySz = keySizeInBits/4; //keySizeInBits defined in aes.js
  var ret = "";
  while (ret.length < keySz) 
    ret += hex[Math.floor(Math.random()*15)];
  return ret;
}

Settings.setPassword = function(password) {
    // ToDo: CRYPT THIS!!
    if (Settings.storeLocation == "memory") {
        Settings.password = password;
        localStorage["password"] = "";
        chrome.extension.sendRequest({setPassword: true, password: password});
    } else if (Settings.storeLocation == "disk") {
        Settings.password = password;
        key = Settings.makeKey();        
        localStorage["password_key"] = key;
        localStorage["password_crypt"] = byteArrayToHex(rijndaelEncrypt(password, hexToByteArray(key), "CBC"));
        chrome.extension.sendRequest({setPassword: true, password: password});
    } else {
        Settings.password = null;
        localStorage["password"] = "";
        chrome.extension.sendRequest({setPassword: true, password: null});
    }
}

Settings.getPassword = function(callback) {
    if (Settings.password != null && Settings.password.length > 0) {
        callback(Settings.password);
    } else {
        chrome.extension.sendRequest({getPassword: true}, function(response) {
            if (response.password != null && response.password.length > 0) {
                callback(response.password);
            } else if (localStorage["password_crypt"]) {
                Settings.password = byteArrayToString(rijndaelDecrypt(hexToByteArray(localStorage["password_crypt"]), hexToByteArray(localStorage["password_key"]), "CBC"));
                callback(Settings.password)
            } else if (localStorage["password"]) {
                Settings.password = localStorage["password"];
                Settings.setPassword(Settings.password);
                localStorage["password"] = null;
                callback(Settings.password);
            } else {
                callback(null);
            }

        });
    }
}

Settings.setHidePassword = function(bool) {
    localStorage["show_generated_password"] = bool;
}

Settings.shouldHidePassword = function() {
    bool = localStorage["show_generated_password"];
    return bool == "true";
}

Settings.setKeepMasterPasswordHash = function(bool) {
  localStorage["keep_master_password_hash"] = bool;
}

Settings.keepMasterPasswordHash = function() {
  bool = localStorage["keep_master_password_hash"];
  return bool == "true";
}

Settings.masterPasswordCharSet = "0123456789abcdef";

Settings.setMasterPasswordHash = function(theHash) {
  localStorage["master_password_hash"] = theHash;
}

Settings.masterPasswordHash = function() {
  return localStorage["master_password_hash"];
}
