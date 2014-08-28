/**
  PasswordMaker - Creates and manages passwords
  Copyright (C) 2005 Eric H. Jung and LeahScape, Inc.
  http://passwordmaker.org/
  grimholtz@yahoo.com

  This library is free software; you can redistribute it and/or modify it
  under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 2.1 of the License, or (at
  your option) any later version.

  This library is distributed in the hope that it will be useful, but WITHOUT
  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
  FITNESSFOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License
  for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this library; if not, write to the Free Software Foundation,
  Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA 
**/

/*
 * Common functions used by md4, md5, ripemd5, sha1, and sha256.
 * Version 2.2 Copyright (C) Jerrad Pierce, Paul Johnston 1999 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 *
 * Modified by Eric H. Jung (grimholtz@yahoo.com)
 * Modified by Eric Aguiar (ultimate.evil@gmail.com)
 */

if (typeof PasswordMaker_HashUtils !== "object") {
    var PasswordMaker_HashUtils = {
        /* bits per input character. 8 - ASCII; 16 - Unicode */
        chrsz: 8,

        /*
         * Encode a string as utf-8.
         */
        str2rstr_utf8: function(input) {
            var output = "";
            for (var i = 0; i < input.length; i++) {
                var c = input.charCodeAt(i);
                if (c < 128) {
                    output += String.fromCharCode(c);
                } else if ((c > 127) && (c < 2048)) {
                    output += String.fromCharCode((c >> 6) | 192);
                    output += String.fromCharCode((c & 63) | 128);
                } else {
                    output += String.fromCharCode((c >> 12) | 224);
                    output += String.fromCharCode(((c >> 6) & 63) | 128);
                    output += String.fromCharCode((c & 63) | 128);
                }
            }
            return output;
        },

        /*
         * Convert a raw string to an array of little-endian words
         * Characters >255 have their high-byte silently ignored.
         */
        rstr2binl: function(input) {
            var output = [];
            for (var j = 0; j < input.length * 8; j += 8) {
                output[j >> 5] |= (input.charCodeAt(j / 8) & 0xFF) << (j % 32);
            }
            return output;
        },

        /*
         * Convert an array of little-endian words to a string
         */
        binl2rstr: function(input) {
            var output = "";
            for (var i = 0; i < input.length * 32; i += 8) {
                output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
            }
            return output;
        },

        /*
         * Convert a raw string to an arbitrary string encoding
         */
        rstr2any: function(input, encoding) {
            var divisor = encoding.length;
            var remainders = [];
            /* Convert to an array of 16-bit big-endian values, forming the dividend */
            var dividend = [];
            for (var i = 0; i < (input.length / 2); i++) {
                dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
            }
            while (dividend.length > 0) {
                var quotient = [];
                var x = 0;
                for (var j = 0; j < dividend.length; j++) {
                    x = (x << 16) + dividend[j];
                    var q = Math.floor(x / divisor);
                    x -= q * divisor;
                    if (quotient.length > 0 || q > 0) {
                        quotient.push(q);
                    }
                }
                remainders.push(x);
                dividend = quotient;
            }
            var output = "";
            while (remainders.length) {
                output += encoding.charAt(remainders.pop());
            }
            return output;
        },

        ///===== big endian =====///
        /*
         * Convert a raw string to an array of big-endian words
         * Characters >255 have their high-byte silently ignored.
         */
        rstr2binb: function(input) {
            var output = [];
            for (var j = 0; j < input.length * 8; j += 8) {
                output[j >> 5] |= (input.charCodeAt(j / 8) & 0xFF) << (24 - j % 32);
            }
            return output;
        },

        /*
         * Convert an array of big-endian words to a string
         */
        binb2rstr: function(input) {
            var output = "";
            for (var i = 0; i < input.length * 32; i += 8) {
                output += String.fromCharCode((input[i >> 5] >>> (24 - i % 32)) & 0xFF);
            }
            return output;
        },

        /*
         * Bitwise rotate a 32-bit number to the left.
         */
        bit_rol: function(num, cnt) {
            return (num << cnt) | (num >>> (32 - cnt));
        },

        /*
         * Add integers, takes care of being passed NaN and undefined.
         */
        safe_add: function(x, y) {
            return (x | 0) + (y | 0);
        }
    };
}
