/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS 180-1
 * Version 2.2 Copyright Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 *
 * Modified by Eric H. Jung (grimholtz@yahoo.com)
 * Modified by Eric Aguiar (ultimate.evil@gmail.com)
 */

if (typeof PasswordMaker_SHA1 !== "object") {
    var PasswordMaker_SHA1 = {
        any_sha1: function(s, e) {
            return PasswordMaker_HashUtils.rstr2any(this.rstr_sha1(PasswordMaker_HashUtils.str2rstr_utf8(s)), e);
        },
        any_hmac_sha1: function(k, d, e) {
            return PasswordMaker_HashUtils.rstr2any(this.rstr_hmac_sha1(PasswordMaker_HashUtils.str2rstr_utf8(k), PasswordMaker_HashUtils.str2rstr_utf8(d)), e);
        },

        /*
         * Calculate the SHA1 of a raw string
         */
        rstr_sha1: function(s) {
            return PasswordMaker_HashUtils.binb2rstr(this.binb_sha1(PasswordMaker_HashUtils.rstr2binb(s), s.length * PasswordMaker_HashUtils.chrsz));
        },

        /*
         * Calculate the SHA-1 of an array of big-endian words and a bit length
         */
        binb_sha1: function(x, len) {
            /* append padding */
            x[len >> 5] |= 0x80 << (24 - len % 32);
            x[((len + 64 >> 9) << 4) + 15] = len;

            var w = [];
            var a = 1732584193,
                b = -271733879,
                c = -1732584194,
                d = 271733878,
                e = -1009589776;

            for (var i = 0; i < x.length; i += 16) {
                var olda = a,
                    oldb = b,
                    oldc = c,
                    oldd = d,
                    olde = e;

                for (var j = 0; j < 80; j++) {
                    if (j < 16) {
                        w[j] = x[i + j];
                    } else {
                        w[j] = PasswordMaker_HashUtils.bit_rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                    }
                    var t = PasswordMaker_HashUtils.safe_add(PasswordMaker_HashUtils.safe_add(PasswordMaker_HashUtils.bit_rol(a, 5), this.sha1_ft(j, b, c, d)), PasswordMaker_HashUtils.safe_add(PasswordMaker_HashUtils.safe_add(e, w[j]), this.sha1_kt(j)));
                    e = d;
                    d = c;
                    c = PasswordMaker_HashUtils.bit_rol(b, 30);
                    b = a;
                    a = t;
                }

                a = PasswordMaker_HashUtils.safe_add(a, olda);
                b = PasswordMaker_HashUtils.safe_add(b, oldb);
                c = PasswordMaker_HashUtils.safe_add(c, oldc);
                d = PasswordMaker_HashUtils.safe_add(d, oldd);
                e = PasswordMaker_HashUtils.safe_add(e, olde);
            }
            return [a, b, c, d, e];
        },

        /*
         * Perform the appropriate triplet combination function for the current
         * iteration
         */
        sha1_ft: function(t, b, c, d) {
            var triplet;
            if (t < 20) {
                triplet = (b & c) | ((~b) & d);
            } else if (t < 40) {
                triplet = (b ^ c ^ d);
            } else if (t < 60) {
                triplet = (b & c) | (b & d) | (c & d);
            } else {
                triplet = (b ^ c ^ d);
            }
            return triplet;
        },

        /*
         * Determine the appropriate additive constant for the current iteration
         */
        sha1_kt: function(t) {
            var additive;
            if (t < 20) {
                additive = 1518500249;
            } else if (t < 40) {
                additive = 1859775393;
            } else if (t < 60) {
                additive = -1894007588;
            } else {
                additive = -899497514;
            }
            return additive;
        },

        /*
         * Calculate the HMAC-SHA1 of a key and some data (raw strings)
         */
        rstr_hmac_sha1: function(key, data) {
            var bkey = PasswordMaker_HashUtils.rstr2binb(key);
            if (bkey.length > 16) {
                bkey = this.binb_sha1(bkey, key.length * 8);
            }

            var ipad = [],
                opad = [];
            for (var i = 0; i < 16; i++) {
                ipad[i] = bkey[i] ^ 0x36363636;
                opad[i] = bkey[i] ^ 0x5C5C5C5C;
            }

            var hash = this.binb_sha1(ipad.concat(PasswordMaker_HashUtils.rstr2binb(data)), 512 + data.length * PasswordMaker_HashUtils.chrsz);
            return PasswordMaker_HashUtils.binb2rstr(this.binb_sha1(opad.concat(hash), 512 + 160));
        }
    };
}
