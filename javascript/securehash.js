if (typeof(ChromePasswordMaker_SecureHash) != "object") {
    var ChromePasswordMaker_SecureHash = {
        seed: 'q#-f21@xNh9sJaKv6TLv8ipR%YgT&RnwMP4Zz2pMya&C44B137+wRkk7C08BF*b1',
        sha256_charset: 'FByDU98TAfzvkuaxgUH3HuMJ1jspdFu9',
        sha1_charset: '0cOJL6EsNlHFMWkbyPCU0EoBOZ80Ck2j',
        md5_charset: 'BPVB1oCrr2BJzhH6qM43kq9lLUqMQWxj',
        md4_charset: 'szPBOPb2WZwWCOYylDNb0kda4HPdp9I7',
        
        make_hash: function (text) {
            var hash = PasswordMaker_SHA256.any_sha256(text, Settings.masterPasswordCharSet);
            return this._hash(hash);
        },

        update_old_hash: function (oldhash) {
            return this._hash(oldhash);
        },
        
        _hash: function (hash) {
            for(var i = 0; i < 16; i++) {
                hash = PasswordMaker_SHA256.any_sha256(hash + this.seed, this.sha256_charset);
                hash = PasswordMaker_SHA1.any_sha1(hash + this.seed, this.sha1_charset);
                hash = PasswordMaker_MD5.any_md5(hash + this.seed, this.md5_charset);
                hash = PasswordMaker_MD4.any_md4(hash + this.seed, this.md4_charset);
            }
            hash = 'n' + hash.substring(1);
            return hash;
        }
    };
}