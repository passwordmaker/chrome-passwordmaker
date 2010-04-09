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
 * Version 2.1 Copyright (C) Jerrad Pierce, Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 *
 * Modified by Eric H. Jung (grimholtz@yahoo.com)
 */

if (typeof(PasswordMaker_HashUtils) != "object") {
	var PasswordMaker_HashUtils = {

    chrsz   : 8,  /* bits per input character. 8 - ASCII; 16 - Unicode      */

    /*
     * Encode a string as utf-8.
     * For efficiency, this assumes the input is valid utf-16.
     */
    str2rstr_utf8 : function(input) {
      var output = "";
      var i = -1;
      var x, y;

      while(++i < input.length)
      {
        /* Decode utf-16 surrogate pairs */
        x = input.charCodeAt(i);
        y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
        if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
        {
          x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
          i++;
        }

        /* Encode output as utf-8 */
        if(x <= 0x7F)
          output += String.fromCharCode(x);
        else if(x <= 0x7FF)
          output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                                        0x80 | ( x         & 0x3F));
        else if(x <= 0xFFFF)
          output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                                        0x80 | ((x >>> 6 ) & 0x3F),
                                        0x80 | ( x         & 0x3F));
        else if(x <= 0x1FFFFF)
          output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                                        0x80 | ((x >>> 12) & 0x3F),
                                        0x80 | ((x >>> 6 ) & 0x3F),
                                        0x80 | ( x         & 0x3F));
      }
      return output;
    },

    /*
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     */
    rstr2binl : function(input) {
      var output = Array(input.length >> 2);
      for(var i = 0; i < output.length; i++)
        output[i] = 0;
      for(var i = 0; i < input.length * 8; i += 8)
        output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
      return output;
    },

    /*
     * Convert an array of little-endian words to a string
     */
    binl2rstr : function(input) {
      var output = "";
      for(var i = 0; i < input.length * 32; i += 8)
        output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);
      return output;
    },

    /*
     * Convert a raw string to an arbitrary string encoding
     */
    rstr2any : function(input, encoding) {
      var divisor = encoding.length;
      var remainders = Array();
      var i, q, x, quotient;

      /* Convert to an array of 16-bit big-endian values, forming the dividend */
      var dividend = Array(input.length / 2);
      var inp = new String(input); // EHJ: added
      for(i = 0; i < dividend.length; i++) {
        dividend[i] = (inp.charCodeAt(i * 2) << 8) | inp.charCodeAt(i * 2 + 1);
      }

      /*
       * Repeatedly perform a long division. The binary array forms the dividend,
       * the length of the encoding is the divisor. Once computed, the quotient
       * forms the dividend for the next step. We stop when the dividend is zero.
       * All remainders are stored for later use.
       */
      while(dividend.length > 0) {
        quotient = Array();
        x = 0;
        for(i = 0; i < dividend.length; i++) {
          x = (x << 16) + dividend[i];
          q = Math.floor(x / divisor);
          x -= q * divisor;
          if(quotient.length > 0 || q > 0)
            quotient[quotient.length] = q;
        }
        remainders[remainders.length] = x;
        dividend = quotient;
      }

      /* Convert the remainders to the output string */
      var output = "";
      for(i = remainders.length - 1; i >= 0; i--)
        output += encoding.charAt(remainders[i]);

      return output;
    },

    ///===== big endian =====\\\

    /*
     * Convert a raw string to an array of big-endian words
     * Characters >255 have their high-byte silently ignored.
     */
    rstr2binb : function(input) {
      var output = Array(input.length >> 2);
      for(var i = 0; i < output.length; i++)
        output[i] = 0;
      for(var i = 0; i < input.length * 8; i += 8)
        output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
      return output;
    },

    /*
     * Convert an array of big-endian words to a string
     */
    binb2rstr : function(input) {
      var output = "";
      for(var i = 0; i < input.length * 32; i += 8)
        output += String.fromCharCode((input[i>>5] >>> (24 - i % 32)) & 0xFF);
      return output;
    },

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    bit_rol : function(num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt));
    },

    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    safe_add : function(x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }
  }
}
