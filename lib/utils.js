const aes = require("aes-js");
const sha256 = require('js-sha256');
const cryptoKeys = require('libp2p-crypto/src/keys')
const PeerId = require('peer-id')
const pem2jwk = require('pem-jwk').pem2jwk
const fromJwk = cryptoKeys.supportedKeys.rsa.fromJwk;
const RNG = require("seededrsa/rng");

module.exports.rsaToPeerID = function(key) {
    return new Promise(function(resolve, reject) {
        fromJwk(pem2jwk(key), function(err, priv) {
          if(err) {
            reject(err)
          } else {
            PeerId.createFromPrivKey(cryptoKeys.marshalPrivateKey(priv), function(err, peerid) {
              if(err) {
                reject(err)
              } else {
                resolve(peerid.toJSON())
              }
            })
          }
        })
    })
}
        


module.exports.sha256PWEncrypt = function(pwd, text, counter) {
    counter = counter || 1;

    let key = aes.utils.hex.toBytes(sha256(pwd))
    text = aes.utils.utf8.toBytes(text);
    let aesCtr = new aes.ModeOfOperation.ctr(key, new aes.Counter(counter));
    return aes.utils.hex.fromBytes(aesCtr.encrypt(text))
}

module.exports.sha256PWDecrypt = function (pwd, hex, counter) {
    counter = counter || 1;

    let key = aes.utils.hex.toBytes(sha256(pwd))
    hex = aes.utils.hex.toBytes(hex);
    let aesCtr = new aes.ModeOfOperation.ctr(key, new aes.Counter(counter));
    return aes.utils.utf8.fromBytes(aesCtr.decrypt(hex))
}


module.exports.mergeOptions = function(a, b) {
  return new Promise(function(resolve, reject) {
    try{
      let options = [a, b].reduce(function (r, o) {
          Object.keys(o).forEach(function (k) { r[k] = o[k]; });
          return r;
      }, {});
      resolve(options);
    } catch(e) {
      reject(e);
    }
      
  })
    
}

module.exports.passwordFromSeed = function(seed, length, chars) {
  return new Promise(function(resolve,reject) {
    try {
      let rng = new RNG(seed);
      chars = chars || "abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890";
      let pass = "";
      for (var x = 0; x < length; x++) {
          pass += chars.charAt(rng.randomRange(0, chars.length));
      }
      resolve(pass)
    } catch(e) {
      reject(e)
    }

  })
}

module.exports.xmur3 = function(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}