class Profile {
    id = 1;
    title = "Default";
    siteList = "";

    // Settings for the URL generation
    url_protocol = false;
    url_subdomain = false;
    url_domain = true;
    url_path = false;

    // Use this text instead of domain if not null
    strUseText = "";

    // Settings for the key generation
    hashAlgorithm = "md5";
    username = "";
    modifier = "";
    passwordLength = 8;
    selectedCharset = Settings.CHARSET_OPTIONS[0];
    passwordPrefix = "";
    passwordSuffix = "";
    description = "";
    whereToUseL33t = "off";
    l33tLevel = 0;

    genPassword(url, masterkey, userName) {
        if (this.selectedCharset.length < 2) {
            return "Not enough chars!";
        }
    
        this.username = userName || "";
    
        // Calls generatepassword() n times in order to support passwords
        // of arbitrary length regardless of character set length.
        var password = "";
        for (var count = 0; password.length < this.passwordLength; count++) {
            // To maintain backwards compatibility with all previous versions of passwordmaker,
            // the first call to _generatepassword() must use the plain "key".
            // Subsequent calls add a number to the end of the key so each iteration
            // doesn't generate the same hash value.
            if (count === 0) {
                password += this.generateCharacter(this.hashAlgorithm, masterkey,
                    url + this.username + this.modifier, this.whereToUseL33t, this.l33tLevel, this.selectedCharset);
            } else {
                password += this.generateCharacter(this.hashAlgorithm, masterkey + "\n" + count,
                    url + this.username + this.modifier, this.whereToUseL33t, this.l33tLevel, this.selectedCharset);
            }
        }
    
        if (this.passwordPrefix) {
            password = this.passwordPrefix + password;
        }
        if (this.passwordSuffix) {
            password = password.slice(0, this.passwordLength - this.passwordSuffix.length) + this.passwordSuffix;
        }
    
        return password.slice(0, this.passwordLength);
    }

    generateCharacter(hashAlgorithm, key, data, whereToUseL33t, l33tLevel, charset) {
        // for non-hmac algorithms, the key is master pw and url concatenated
        var usingHMAC = (/hmac/i).test(hashAlgorithm);
        if (!usingHMAC) {
            key += data;
        }

        // apply l33t before the algorithm?
        if (whereToUseL33t === "both" || whereToUseL33t === "before-hashing") {
            key = PasswordMaker_l33t.convert(l33tLevel, key);
            if (usingHMAC) {
                data = PasswordMaker_l33t.convert(l33tLevel, data); // new for 0.3; 0.2 didn't apply l33t to _data_ for HMAC algorithms
            }
        }

        // convert string only if it contains a non-ascii multi-byte character before passing to algorithms
        // the md5_v6 algorithm apparently never used converted string data
        var md5v6 = /md5_v6/i;
        var notAscii = /[^\x00-\x7F]/;
        if (notAscii.test(key) && !md5v6.test(hashAlgorithm)) {
            //key = encodeURI(key).replace(/%[\da-f]{2}/gi, (char) => String.fromCodePoint(parseInt(char.replace(/%/, ""), 16)));
            key = new TextEncoder().encode(key).reduce((keyStr, char) => keyStr += String.fromCodePoint(char), "");
        }
        if (notAscii.test(data) && !md5v6.test(hashAlgorithm)) {
            //data = encodeURI(data).replace(/%[\da-f]{2}/gi, (char) => String.fromCodePoint(parseInt(char.replace(/%/, ""), 16)));
            data = new TextEncoder().encode(data).reduce((dataStr, char) => dataStr += String.fromCodePoint(char), "");
        }

        // apply the algorithm
        var password = "";
        switch (hashAlgorithm) {
            case "sha256":
                password = PasswordMaker_SHA256.any_sha256(key, charset);
                break;
            case "hmac-sha256":
                password = PasswordMaker_SHA256.any_hmac_sha256(key, data, charset, true);
                break;
            case "hmac-sha256_fix":
                password = PasswordMaker_SHA256.any_hmac_sha256(key, data, charset, false);
                break;
            case "sha1":
                password = PasswordMaker_SHA1.any_sha1(key, charset);
                break;
            case "hmac-sha1":
                password = PasswordMaker_SHA1.any_hmac_sha1(key, data, charset);
                break;
            case "md4":
                password = PasswordMaker_MD4.any_md4(key, charset);
                break;
            case "hmac-md4":
                password = PasswordMaker_MD4.any_hmac_md4(key, data, charset);
                break;
            case "md5":
                password = PasswordMaker_MD5.any_md5(key, charset);
                break;
            case "md5_v6":
                password = PasswordMaker_MD5_V6.hex_md5(key);
                break;
            case "hmac-md5":
                password = PasswordMaker_MD5.any_hmac_md5(key, data, charset);
                break;
            case "hmac-md5_v6":
                password = PasswordMaker_MD5_V6.hex_hmac_md5(key, data);
                break;
            case "rmd160":
                password = PasswordMaker_RIPEMD160.any_rmd160(key, charset);
                break;
            case "hmac-rmd160":
                password = PasswordMaker_RIPEMD160.any_hmac_rmd160(key, data, charset);
                break;
        }
        // apply l33t after the algorithm?
        if (whereToUseL33t === "both" || whereToUseL33t === "after-hashing") {
            return PasswordMaker_l33t.convert(l33tLevel, password);
        }
        return password;
    }

    // Given a list of domain segments like [www,google,co,uk], return the
    // subdomain and domain strings (ie, [www, google.co.uk]).
    splitSubdomain(segments) {
        // List of top-level domains, parsed from domains.rdf from PasswordMaker Firefox version.
        var TOPLEVELDOMAINS = new Set(["ab.ca","ac.cn","ac.cr","ac.id","ac.il","ac.in","ac.jp","ac.kr","ac.nz","ac.uk","ac.za","act.edu.au","act.gov.au","ad.jp","adm.br","adv.br","agr.br","agric.za","agro.pl","ah.cn","aid.pl","ak.us","al.us","aland.fi","alt.za","am.br","ar.us","archie.au","arq.br","art.br","asn.au","atm.pl","ato.br","auto.pl","av.tr","az.us","bbs.tr","bc.ca","bel.tr","bio.br","biz.pl","biz.tr","bj.cn","bmd.br","bourse.za","ca.us","cherkassy.ua","chernigov.ua","chernovtsy.ua","chiyoda.tokyo.jp","cim.br","city.za","ck.ua","club.tw","cn.ua","cng.br","cnt.br","co.ck","co.cr","co.id","co.il","co.im","co.in","co.jp","co.kr","co.nz","co.uk","co.us","co.za","com.au","com.bb","com.br","com.cd","com.cn","com.mx","com.pl","com.pt","com.sg","com.tr","com.tw","com.ua","conf.au","coop.br","cq.cn","cri.nz","crimea.ua","csiro.au","ct.us","cv.ua","cybernet.za","db.za","dc.us","de.us","dn.ua","dnepropetrovsk.ua","dni.us","donetsk.ua","dp.ua","dr.tr","ebiz.tw","ecn.br","ed.cr","ed.jp","edu.au","edu.br","edu.ck","edu.cn","edu.in","edu.mx","edu.pl","edu.pt","edu.tr","edu.ua","edu.za","eng.br","esp.br","etc.br","eti.br","eu.int","far.br","fed.us","fi.cr","firm.in","fj.cn","fl.us","fm.br","fnd.br","fot.br","fst.br","g12.br","ga.us","game.tw","gd.cn","geek.nz","gen.in","gen.nz","gen.tr","ggf.br","gmina.pl","go.cr","go.id","go.jp","go.kr","gob.mx","gov.au","gov.bb","gov.br","gov.ck","gov.cn","gov.il","gov.in","gov.pt","gov.tr","gov.tw","gov.ua","gov.uk","gov.za","govt.nz","gr.jp","grondar.za","gs.cn","gsm.pl","gx.cn","gz.cn","ha.cn","hb.cn","he.cn","hi.cn","hi.us","hl.cn","hn.cn","ia.us","iaccess.za","id.au","id.us","idf.il","idv.tw","if.ua","il.us","imb.br","imt.za","in.us","inca.za","ind.br","ind.in","inf.br","info.au","info.pl","info.tr","int.pt","isa.us","ivano-frankivsk.ua","iwi.nz","jl.cn","jor.br","js.cn","jx.cn","k12.il","k12.tr","kh.ua","kharkov.ua","kherson.ua","kids.us","kiev.ua","kirovograd.ua","km.ua","kr.ua","ks.ua","ks.us","ky.us","la.us","landesign.za","law.za","lel.br","lg.jp","lg.ua","ln.cn","ltd.uk","lugansk.ua","lutsk.ua","lviv.ua","ma.us","mail.pl","maori.nz","mat.br","mb.ca","md.us","me.uk","me.us","med.br","media.pl","mi.us","miasta.pl","mil.br","mil.id","mil.in","mil.kr","mil.nz","mil.tr","mil.za","mk.ua","mn.us","mo.us","mod.uk","ms.us","mt.us","muni.il","mus.br","name.tr","nb.ca","nc.us","nd.us","ne.jp","ne.kr","ne.us","net.au","net.bb","net.br","net.cd","net.ck","net.cn","net.id","net.il","net.in","net.mx","net.nz","net.pl","net.pt","net.tr","net.tw","net.ua","net.uk","net.za","nf.ca","ngo.za","nh.us","nhs.uk","nic.uk","nieruchomosci.pl","nikolaev.ua","nil.pl","nis.za","nj.us","nl.ca","nm.cn","nm.us","nom.br","nom.pl","nom.za","nome.pt","not.br","ns.ca","nsn.us","nsw.edu.au","nsw.gov.au","nt.ca","nt.edu.au","nt.gov.au","ntr.br","nu.ca","nv.us","nx.cn","ny.us","od.ua","odessa.ua","odo.br","oh.us","ok.us","olivetti.za","on.ca","or.cr","or.id","or.jp","or.kr","or.us","org.au","org.bb","org.br","org.cd","org.ck","org.cn","org.il","org.im","org.in","org.mx","org.nz","org.pt","org.tr","org.tw","org.ua","org.uk","org.za","oz.au","pa.us","pc.pl","pe.ca","pe.kr","pix.za","pl.ua","plc.uk","pol.tr","police.uk","poltava.ua","powiat.pl","ppg.br","priv.pl","pro.br","psc.br","psi.br","publ.pt","qc.ca","qh.cn","qld.edu.au","qld.gov.au","qsl.br","realestate.pl","rec.br","rel.pl","res.in","ri.us","rovno.ua","rv.ua","sa.cr","sa.edu.au","sa.gov.au","sc.cn","sc.us","sch.id","sch.uk","school.nz","school.za","sd.cn","sd.us","sebastopol.ua","sex.pl","sh.cn","shop.pl","sk.ca","sklep.pl","slg.br","sn.cn","sos.pl","srv.br","sumy.ua","sx.cn","szkola.pl","targi.pl","tas.edu.au","tas.gov.au","tcvb.or.jp","te.ua","tel.tr","telememo.au","ternopil.ua","tj.cn","tm.pl","tm.za","tmp.br","tn.us","tourism.pl","travel.pl","trd.br","tur.br","turystyka.pl","tv.br","tx.us","ut.us","uz.ua","uzhgorod.ua","va.us","vet.br","vic.edu.au","vic.gov.au","vinnica.ua","vn.ua","vt.us","wa.edu.au","wa.gov.au","wa.us","war.net.id","web.id","web.tr","web.za","wi.us","wv.us","wy.us","xj.cn","xz.cn","yk.ca","yn.cn","zaporizhzhe.ua","zhitomir.ua","zj.cn","zlg.br","zp.ua","zt.ua"]);

        for (var i = 0; i < segments.length; ++i) {
            var suffix = segments.slice(i).join(".");
            if (TOPLEVELDOMAINS.has(suffix)) {
                var pivot = Math.max(0, i - 1);
                return [segments.slice(0, pivot).join("."), segments.slice(pivot).join(".")];
            }
        }
        // None of the segments are in our TLD list. Assume the last component is
        // the TLD, like ".com". The domain is therefore the last 2 components.
        return [segments.slice(0, -2).join("."), segments.slice(-2).join(".")];
    }

    getUrl(url) {
        var groups = url.match(/([^:/]*?:\/\/)?([^:/]*)([^#]*)/);

        var domainSegments = groups[2].split(".");
        while (domainSegments.length < 3) {
            domainSegments.unshift(""); // Helps prevent the URL from displaying undefined in the URL to use box
        }

        var resultURL = "";
        if (this.url_protocol && groups[1] !== undefined) {
            resultURL += groups[1];
        }
        var splitSegments = this.splitSubdomain(domainSegments);
        if (this.url_subdomain) {
            resultURL += splitSegments[0];
        }
        if (this.url_domain) {
            if (resultURL.length !== 0 && !resultURL.endsWith(".") && !resultURL.endsWith("/")) {
                resultURL += ".";
            }
            resultURL += splitSegments[1];
        }
        if (this.url_path) {
            resultURL += groups[3];
        }

        return resultURL;
    }
}
