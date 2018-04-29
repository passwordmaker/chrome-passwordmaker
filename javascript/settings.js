var Settings = {
    currentUrl: "",
    profiles: [],
    storeLocation: localStorage.getItem("store_location") || "memory",
    syncDataAvailable: false
};

var CHARSET_OPTIONS = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()_-+={}|[]\\:\";'<>?,./",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    "0123456789abcdef",
    "0123456789",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "`~!@#$%^&*()_-+={}|[]:\";'<>?,./"
];

// List of top-level domains, parsed from domains.rdf from the PasswordMaker
// Firefox version.
var TOPLEVELDOMAINS = {"ab.ca":1,"ac.cn":1,"ac.cr":1,"ac.id":1,"ac.il":1,"ac.in":1,"ac.jp":1,"ac.kr":1,"ac.nz":1,"ac.uk":1,"ac.za":1,"act.edu.au":1,"act.gov.au":1,"ad.jp":1,"adm.br":1,"adv.br":1,"agr.br":1,"agric.za":1,"agro.pl":1,"ah.cn":1,"aid.pl":1,"ak.us":1,"al.us":1,"aland.fi":1,"alt.za":1,"am.br":1,"ar.us":1,"archie.au":1,"arq.br":1,"art.br":1,"asn.au":1,"atm.pl":1,"ato.br":1,"auto.pl":1,"av.tr":1,"az.us":1,"bbs.tr":1,"bc.ca":1,"bel.tr":1,"bio.br":1,"biz.pl":1,"biz.tr":1,"bj.cn":1,"bmd.br":1,"bourse.za":1,"ca.us":1,"cherkassy.ua":1,"chernigov.ua":1,"chernovtsy.ua":1,"chiyoda.tokyo.jp":1,"cim.br":1,"city.za":1,"ck.ua":1,"club.tw":1,"cn.ua":1,"cng.br":1,"cnt.br":1,"co.ck":1,"co.cr":1,"co.id":1,"co.il":1,"co.im":1,"co.in":1,"co.jp":1,"co.kr":1,"co.nz":1,"co.uk":1,"co.us":1,"co.za":1,"com.au":1,"com.bb":1,"com.br":1,"com.cd":1,"com.cn":1,"com.mx":1,"com.pl":1,"com.pt":1,"com.sg":1,"com.tr":1,"com.tw":1,"com.ua":1,"conf.au":1,"coop.br":1,"cq.cn":1,"cri.nz":1,"crimea.ua":1,"csiro.au":1,"ct.us":1,"cv.ua":1,"cybernet.za":1,"db.za":1,"dc.us":1,"de.us":1,"dn.ua":1,"dnepropetrovsk.ua":1,"dni.us":1,"donetsk.ua":1,"dp.ua":1,"dr.tr":1,"ebiz.tw":1,"ecn.br":1,"ed.cr":1,"ed.jp":1,"edu.au":1,"edu.br":1,"edu.ck":1,"edu.cn":1,"edu.in":1,"edu.mx":1,"edu.pl":1,"edu.pt":1,"edu.tr":1,"edu.ua":1,"edu.za":1,"eng.br":1,"esp.br":1,"etc.br":1,"eti.br":1,"eu.int":1,"far.br":1,"fed.us":1,"fi.cr":1,"firm.in":1,"fj.cn":1,"fl.us":1,"fm.br":1,"fnd.br":1,"fot.br":1,"fst.br":1,"g12.br":1,"ga.us":1,"game.tw":1,"gd.cn":1,"geek.nz":1,"gen.in":1,"gen.nz":1,"gen.tr":1,"ggf.br":1,"gmina.pl":1,"go.cr":1,"go.id":1,"go.jp":1,"go.kr":1,"gob.mx":1,"gov.au":1,"gov.bb":1,"gov.br":1,"gov.ck":1,"gov.cn":1,"gov.il":1,"gov.in":1,"gov.pt":1,"gov.tr":1,"gov.tw":1,"gov.ua":1,"gov.uk":1,"gov.za":1,"govt.nz":1,"gr.jp":1,"grondar.za":1,"gs.cn":1,"gsm.pl":1,"gx.cn":1,"gz.cn":1,"ha.cn":1,"hb.cn":1,"he.cn":1,"hi.cn":1,"hi.us":1,"hl.cn":1,"hn.cn":1,"ia.us":1,"iaccess.za":1,"id.au":1,"id.us":1,"idf.il":1,"idv.tw":1,"if.ua":1,"il.us":1,"imb.br":1,"imt.za":1,"in.us":1,"inca.za":1,"ind.br":1,"ind.in":1,"inf.br":1,"info.au":1,"info.pl":1,"info.tr":1,"int.pt":1,"isa.us":1,"ivano-frankivsk.ua":1,"iwi.nz":1,"jl.cn":1,"jor.br":1,"js.cn":1,"jx.cn":1,"k12.il":1,"k12.tr":1,"kh.ua":1,"kharkov.ua":1,"kherson.ua":1,"kids.us":1,"kiev.ua":1,"kirovograd.ua":1,"km.ua":1,"kr.ua":1,"ks.ua":1,"ks.us":1,"ky.us":1,"la.us":1,"landesign.za":1,"law.za":1,"lel.br":1,"lg.jp":1,"lg.ua":1,"ln.cn":1,"ltd.uk":1,"lugansk.ua":1,"lutsk.ua":1,"lviv.ua":1,"ma.us":1,"mail.pl":1,"maori.nz":1,"mat.br":1,"mb.ca":1,"md.us":1,"me.uk":1,"me.us":1,"med.br":1,"media.pl":1,"mi.us":1,"miasta.pl":1,"mil.br":1,"mil.id":1,"mil.in":1,"mil.kr":1,"mil.nz":1,"mil.tr":1,"mil.za":1,"mk.ua":1,"mn.us":1,"mo.us":1,"mod.uk":1,"ms.us":1,"mt.us":1,"muni.il":1,"mus.br":1,"name.tr":1,"nb.ca":1,"nc.us":1,"nd.us":1,"ne.jp":1,"ne.kr":1,"ne.us":1,"net.au":1,"net.bb":1,"net.br":1,"net.cd":1,"net.ck":1,"net.cn":1,"net.id":1,"net.il":1,"net.in":1,"net.mx":1,"net.nz":1,"net.pl":1,"net.pt":1,"net.tr":1,"net.tw":1,"net.ua":1,"net.uk":1,"net.za":1,"nf.ca":1,"ngo.za":1,"nh.us":1,"nhs.uk":1,"nic.uk":1,"nieruchomosci.pl":1,"nikolaev.ua":1,"nil.pl":1,"nis.za":1,"nj.us":1,"nl.ca":1,"nm.cn":1,"nm.us":1,"nom.br":1,"nom.pl":1,"nom.za":1,"nome.pt":1,"not.br":1,"ns.ca":1,"nsn.us":1,"nsw.edu.au":1,"nsw.gov.au":1,"nt.ca":1,"nt.edu.au":1,"nt.gov.au":1,"ntr.br":1,"nu.ca":1,"nv.us":1,"nx.cn":1,"ny.us":1,"od.ua":1,"odessa.ua":1,"odo.br":1,"oh.us":1,"ok.us":1,"olivetti.za":1,"on.ca":1,"or.cr":1,"or.id":1,"or.jp":1,"or.kr":1,"or.us":1,"org.au":1,"org.bb":1,"org.br":1,"org.cd":1,"org.ck":1,"org.cn":1,"org.il":1,"org.im":1,"org.in":1,"org.mx":1,"org.nz":1,"org.pt":1,"org.tr":1,"org.tw":1,"org.ua":1,"org.uk":1,"org.za":1,"oz.au":1,"pa.us":1,"pc.pl":1,"pe.ca":1,"pe.kr":1,"pix.za":1,"pl.ua":1,"plc.uk":1,"pol.tr":1,"police.uk":1,"poltava.ua":1,"powiat.pl":1,"ppg.br":1,"priv.pl":1,"pro.br":1,"psc.br":1,"psi.br":1,"publ.pt":1,"qc.ca":1,"qh.cn":1,"qld.edu.au":1,"qld.gov.au":1,"qsl.br":1,"realestate.pl":1,"rec.br":1,"rel.pl":1,"res.in":1,"ri.us":1,"rovno.ua":1,"rv.ua":1,"sa.cr":1,"sa.edu.au":1,"sa.gov.au":1,"sc.cn":1,"sc.us":1,"sch.id":1,"sch.uk":1,"school.nz":1,"school.za":1,"sd.cn":1,"sd.us":1,"sebastopol.ua":1,"sex.pl":1,"sh.cn":1,"shop.pl":1,"sk.ca":1,"sklep.pl":1,"slg.br":1,"sn.cn":1,"sos.pl":1,"srv.br":1,"sumy.ua":1,"sx.cn":1,"szkola.pl":1,"targi.pl":1,"tas.edu.au":1,"tas.gov.au":1,"tcvb.or.jp":1,"te.ua":1,"tel.tr":1,"telememo.au":1,"ternopil.ua":1,"tj.cn":1,"tm.pl":1,"tm.za":1,"tmp.br":1,"tn.us":1,"tourism.pl":1,"travel.pl":1,"trd.br":1,"tur.br":1,"turystyka.pl":1,"tv.br":1,"tx.us":1,"ut.us":1,"uz.ua":1,"uzhgorod.ua":1,"va.us":1,"vet.br":1,"vic.edu.au":1,"vic.gov.au":1,"vinnica.ua":1,"vn.ua":1,"vt.us":1,"wa.edu.au":1,"wa.gov.au":1,"wa.us":1,"war.net.id":1,"web.id":1,"web.tr":1,"web.za":1,"wi.us":1,"wv.us":1,"wy.us":1,"xj.cn":1,"xz.cn":1,"yk.ca":1,"yn.cn":1,"zaporizhzhe.ua":1,"zhitomir.ua":1,"zj.cn":1,"zlg.br":1,"zp.ua":1,"zt.ua":1};

Settings.getProfile = id => {
    for (var i = 0; i < Settings.profiles.length; i++) {
        if (Settings.profiles[i].id === parseInt(id, 10)) {
            return Settings.profiles[i];
        }
    }
};

Settings.getMaxId = () => {
    var maxId = 0;
    for (var i = 0; i < Settings.profiles.length; i++) {
        if (Settings.profiles[i].id > maxId) {
            maxId = Settings.profiles[i].id;
        }
    }
    return maxId;
};

Settings.addProfile = profile => {
    profile.id = Settings.getMaxId() + 1;
    Settings.profiles.push(profile);
};

Settings.deleteProfile = id => {
    for (var i = 0; i < Settings.profiles.length; i++) {
        if (Settings.profiles[i].id === parseInt(id, 10)) {
            Settings.profiles.splice(i, 1);
            Settings.saveProfiles();
        }
    }
};

Settings.loadProfilesFromString = profiles => {
    Settings.profiles = [];
    JSON.parse(profiles).forEach((item) => {
        Settings.profiles.push(Object.assign(Object.create(Profile), item));
    });
};

Settings.loadLocalProfiles = () => {
    if (Settings.ifDataExists("profiles")) {
        Settings.loadProfilesFromString(localStorage.getItem("profiles"));
    } else {
        var normal = Object.create(Profile);
        var alpha = Object.create(Profile);
        alpha.id = 2;
        alpha.title = "Alphanumeric";
        alpha.selectedCharset = CHARSET_OPTIONS[1];
        Settings.profiles = [normal, alpha];
        Settings.saveProfiles();
    }
};

Settings.loadProfiles = () => {
    Settings.loadLocalProfiles();
    if (Settings.ifDataExists("synced_profiles")) {
        Settings.syncDataAvailable = true;
        if (Settings.ifDataExists("sync_profiles_password")) {
            var profiles = Settings.decrypt(localStorage.getItem("sync_profiles_password"), localStorage.getItem("synced_profiles"));
            if (profiles.length !== 0) {
                if (Settings.shouldSyncProfiles()) {
                    Settings.loadProfilesFromString(profiles);
                }
            }
        }
    }
};

Settings.alphaSortProfiles = () => {
    var profiles = Settings.profiles,
        defaultProfile = profiles.shift();

    profiles.sort(function(a, b) {
        if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
        if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
        return 0;
    });

    profiles.unshift(defaultProfile);
    Settings.profiles = profiles;
};

Settings.saveSyncedProfiles = data => {
    var oldKeys = localStorage.getItem("synced_profiles_keys");
    var threshold = Math.round(chrome.storage.sync.QUOTA_BYTES_PER_ITEM * 0.95);
    var output = {};

    chrome.storage.sync.clear(() => {
        if (!chrome.runtime.lastError) {
            if (data.length <= threshold) {
                output.synced_profiles = data;
                chrome.storage.sync.set(output, () => {
                    if (chrome.runtime.lastError) {
                        alert("Could not sync data : " + chrome.runtime.lastError.message);
                    }
                });
            } else {
                var splitter = new RegExp("[\\s\\S]{1," + threshold + "}", "g");
                var parts = data.match(splitter);
                var date = Date.now();
                var keys = [];
                for (var i = 0; i < parts.length; ++i) {
                    output[date + i] = parts[i];
                    keys[i] = date + i;
                }
                output.synced_profiles = keys;
                chrome.storage.sync.set(output, () => {
                    if (!chrome.runtime.lastError) {
                        chrome.storage.sync.remove(oldKeys.split(","));
                    } else {
                        alert("Could not sync large profile data : " + chrome.runtime.lastError.message);
                    }
                });
            }
        }
    });
};

Settings.saveProfiles = () => {
    for (var i = 0; i < Settings.profiles.length; i++) {
        Settings.profiles[i].id = i + 1;
    }
    var stringified = JSON.stringify(Settings.profiles);
    localStorage.setItem("profiles", stringified);
    if (Settings.shouldSyncProfiles() && (!Settings.syncDataAvailable || Settings.syncPasswordOk())) {
        Settings.saveSyncedProfiles(Settings.encrypt(localStorage.getItem("sync_profiles_password"), stringified));
    }
};

Settings.setStoreLocation = store => {
    if (Settings.storeLocation !== store) {
        Settings.storeLocation = store;
        localStorage.setItem("store_location", store);

        if (Settings.storeLocation !== "disk") {
            localStorage.removeItem("password_crypt");
        }
        if (Settings.storeLocation === "never") {
            localStorage.removeItem("password_crypt");
            Settings.setBgPassword("");
        }
    }
};

Settings.setBgPassword = pw => {
    chrome.runtime.getBackgroundPage(bg => {
        bg.password = pw;
    });

    if (pw.length !== 0 && Settings.storeLocation === "memory_expire") {
        Settings.createExpirePasswordAlarm();
    }
};

Settings.createExpirePasswordAlarm = () => {
    chrome.alarms.create("expire_password", {
        delayInMinutes: parseInt(localStorage.getItem("expire_password_minutes"), 10)
    });
};

Settings.setPassword = () => {
    if (Settings.storeLocation === "never") {
        Settings.setBgPassword("");
    } else {
        var password = $("#password").val();
        var bits = crypto.getRandomValues(new Uint32Array(8));
        var key = sjcl.codec.base64.fromBits(bits);
        localStorage.setItem("password_key", key);

        if (Settings.storeLocation === "memory" || Settings.storeLocation === "memory_expire") {
            Settings.setBgPassword(Settings.encrypt(key, password));
        } else if (Settings.storeLocation === "disk") {
            Settings.setBgPassword(Settings.encrypt(key, password));
            localStorage.setItem("password_crypt", Settings.encrypt(key, password));
        }
    }
};

Settings.getPassword = bgPass => {
    var pass = "";
    if (bgPass.length !== 0) {
        pass = Settings.decrypt(localStorage.getItem("password_key"), bgPass);
    } else if (Settings.ifDataExists("password_crypt")) {
        pass = Settings.decrypt(localStorage.getItem("password_key"), localStorage.getItem("password_crypt"));
    }
    return pass;
};

Settings.ifDataExists = entry => {
    return (localStorage.getItem(entry) !== null) && (localStorage.getItem(entry).length !== 0);
};

Settings.shouldHidePassword = () => {
    return localStorage.getItem("show_generated_password") === "true";
};

Settings.keepMasterPasswordHash = () => {
    return localStorage.getItem("keep_master_password_hash") === "true";
};

Settings.shouldSyncProfiles = () => {
    return localStorage.getItem("sync_profiles") === "true";
};

Settings.useVerificationCode = () => {
    return localStorage.getItem("use_verification_code") === "true";
};

Settings.shouldShowStrength = () => {
    return localStorage.getItem("show_password_strength") === "true";
};

Settings.shouldAlphaSortProfiles = () => {
    return localStorage.getItem("alpha_sort_profiles") === "true";
};

Settings.stopSync = () => {
    localStorage.removeItem("sync_profiles_password");
    localStorage.setItem("sync_profiles", "false");
    Settings.loadLocalProfiles();
};

Settings.startSyncWith = password => {
    var syncPassHash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(password));
    if (Settings.syncDataAvailable) {
        var profiles = Settings.decrypt(syncPassHash, localStorage.getItem("synced_profiles"));
        if (profiles.length !== 0) {
            Settings.loadProfilesFromString(profiles);
            return syncPassHash;
        }
    } else {
        localStorage.setItem("sync_profiles_password", syncPassHash);
        Settings.saveSyncedProfiles(Settings.encrypt(syncPassHash, JSON.stringify(Settings.profiles)));
        return syncPassHash;
    }
    return false;
};

Settings.syncPasswordOk = () => {
    var syncHash = localStorage.getItem("sync_profiles_password") || "";
    var profiles = Settings.decrypt(syncHash, localStorage.getItem("synced_profiles"));
    if (profiles.length !== 0) {
        return true;
    } else {
        return false;
    }
};

Settings.make_pbkdf2 = (password, previousSalt, iter) => {
    var usedSalt = previousSalt || sjcl.codec.base64.fromBits(crypto.getRandomValues(new Uint32Array(8)));
    var iterations = iter || 1000;
    var derived = sjcl.codec.hex.fromBits(sjcl.misc.pbkdf2(password, usedSalt, iterations));
    return {
        hash: derived,
        salt: usedSalt,
        iter: iterations
    };
};

Settings.encrypt = (password, data) => {
    return sjcl.encrypt(password, data, {
        ks: 256,
        ts: 128
    });
};

Settings.decrypt = (password, data) => {
    try {
        return sjcl.decrypt(password, data);
    } catch (e) {
        return "";
    }
};

// strength calculation based on Firefox version to return an object
Settings.getPasswordStrength = pw => {
    // char frequency
    var uniques = [];
    for (var i = 0; i < pw.length; i++) {
        var current = pw.charCodeAt(i);
        if (uniques.indexOf(current) === -1) {
            uniques.push(current);
        }
    }
    var r0 = (uniques.length === 1) ? 0 : (uniques.length / pw.length);

    // length of the password - 1pt per char over 5, up to 15 for 10 pts total
    var r1 = pw.length;
    if (r1 >= 15) {
        r1 = 10;
    } else if (r1 < 5) {
        r1 = -5;
    } else {
        r1 -= 5;
    }

    var quarterLen = Math.round(pw.length / 4);

    // ratio of numbers in the password
    var c = pw.replace(/[0-9]/g, "");
    var nums = (pw.length - c.length);
    c = nums > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - nums);
    var r2 = 1 - (c / quarterLen);

    // ratio of symbols in the password
    c = pw.replace(/\W/g, "");
    var syms = (pw.length - c.length);
    c = syms > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - syms);
    var r3 = 1 - (c / quarterLen);

    // ratio of uppercase in the password
    c = pw.replace(/[A-Z]/g, "");
    var upper = (pw.length - c.length);
    c = upper > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - upper);
    var r4 = 1 - (c / quarterLen);

    // ratio of lowercase in the password
    c = pw.replace(/[a-z]/g, "");
    var lower = (pw.length - c.length);
    c = lower > quarterLen * 2 ? quarterLen : Math.abs(quarterLen - lower);
    var r5 = 1 - (c / quarterLen);

    var pwStrength = (((r0 + r2 + r3 + r4 + r5) / 5) * 100) + r1;

    // make sure strength is a valid value between 0 and 100
    if (isNaN(pwStrength)) pwStrength = 0;
    if (pwStrength < 0) pwStrength = 0;
    if (pwStrength > 100) pwStrength = 100;

    // return strength as an integer + boolean usage of character type
    return {
        strength: Math.floor(pwStrength),
        hasUpper: Boolean(upper),
        hasLower: Boolean(lower),
        hasDigit: Boolean(nums),
        hasSymbol: Boolean(syms)
    };
};
