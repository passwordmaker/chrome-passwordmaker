if (typeof(ChromePasswordMaker_SecureHash) != "object") {
    var ChromePasswordMaker_SecureHash = {
        seed: 'q#-f21@xNh9sJaKv6TLv8ipR%YgT&RnwMP4Zz2pMya&C44B137+wRkk7C08BF*b1',
        sha256_charset: 'FByDU98TAfzvkuaxgUH3HuMJ1jspdFu9',
        make_hash: function(text) {
            var hash = PasswordMaker_SHA256.any_sha256(text, "0123456789abcdef");
            return this._hash(hash);
        },

        update_old_hash: function (oldhash) {
            return this._hash(oldhash);
        },

        _hash: function(hash) {
            for (var i = 0; i < 16; i++) {
                hash = PasswordMaker_SHA256.any_sha256(hash + this.seed, this.sha256_charset);
            }
            hash = 'n' + hash.substring(1);
            return hash;
        }
    };
}
