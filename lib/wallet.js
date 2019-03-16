
const bip39 = require("bip39");
const bip32 = require("bip32");
const utils = require("./utils");
const storage = require("./storage");
const RSA = require("seededrsa");
const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
const Keystore = require("./keystore");
const sha256 = require("js-sha256")
const BN = require("bn.js")
const Password = require("./password")
const Identities = require('orbit-db-identity-provider')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

const emptyWallet = {
    "seed":null,
    "entropy":null,
    "ipfs":null,
    "orbitdb":null,
    "rsa":null,
    "backedup":false,
    "setup":false,

}

const defaultIpfsOptions = {
    EXPERIMENTAL: {
      pubsub: true
    }
}

class Wallet {
    constructor(password) {
        this.storage = new storage.EncryptedStore(password, "orbitwallet");
        if(Object.keys(this.storage.items).length == 0) {
            let keys = Object.keys(emptyWallet)
            for(var i=0;i<keys;i++) {
                this.storage.setItem(keys[i], emptyWallet[keys[i]])
            }
        }

    }
    async _generateRSA(mnemonic) {
        return new Promise(function(resolve, reject) {
            try {
                let rsaKeys = new RSA(mnemonic);
                rsaKeys.generate(2048);
                let rsa = {};
                rsa['privateKey'] = rsaKeys.privateKey();
                rsa["publicKey"] = rsaKeys.publicKey();
                resolve(rsa);
            } catch(e) {
                reject(e);
            }
        });
    }

    async _generateOrbitKeys(seed) {
        return new Promise(function(resolve, reject) {
            try {
                /*
                //this should follow some standard similar to bitcoin, litecoin, dogecoin, etc.
                //like etherum uses m / 44' / 60' / account' / change / address_index
                //for example: let node = hdkey.derive("m/44'/80'/0'/0/0") where 80 is some preagreed on standard. 
                //harded keys have the ' but we could for example generate new keys based on an xpub generated from
                //the path:m/44'/60'/0' or let orbitnode = node.derive("m/44'/60'/0'). then acces the xpub via node.xpubkey
                //that xpub is then public. So anyone else can come in and derive the child public keys
                //useful for ecrypted chat. Where they store a public xpub and then anyone who wants to come in and chat later
                //derives the next public key available from say a counter that is public writeable.   
                */
                let node = bip32.fromSeed(Buffer.from(seed, "hex"))
                let keys = node.derive(0);
                let orbitkeys = {
                    privateKey:node.privateKey.toString("hex"),
                    publicKey:node.publicKey.toString("hex"),
                }
                resolve(orbitkeys);
            } catch(e) {
                reject(e);
            }
        })
    }
    async restoreFromMnemonic(mnemonic, password) {
        let self = this;
        return new Promise(async function(resolve, reject){
            try {
                //setup rsa
                let rsa = await self._generateRSA(mnemonic);
                self.storage.setItem("rsa", rsa);
                //convert the mnemonic phrase to a seed
                let seed = bip39.mnemonicToSeedHex(mnemonic);
                let encrypted_seed = utils.sha256PWEncrypt(password, seed)
                self.storage.setItem("seed", encrypted_seed);
                //save entropy
                let entropy = bip39.mnemonicToEntropy(mnemonic)
                entropy = utils.sha256PWEncrypt(password, entropy);
                self.storage.setItem("entropy", entropy)
                //setup orbit
                let orbitkeys = await self._generateOrbitKeys(seed);
                self.storage.setItem("orbitdb", orbitkeys);
                //setup ipfs
                let peerid = await utils.rsaToPeerID(rsa['privateKey'])
                let _ipfs = {};
                _ipfs["Identity"] = {
                    "PeerID":peerid["id"],
                    "PrivKey":peerid["privKey"],
                }
                self.storage.setItem("ipfs", _ipfs);
                self.storage.setItem("setup", true);
                self.storage.setItem("backedup", false);
                self.storage.save(password);
                resolve(true);
            } catch(e) {
                reject(e);
            }
        });
                

    }

    generateMnemonic() {
        return bip39.generateMnemonic();
    }

    isSetup() {
        return this.storage.getItem("setup");
    }

    isBackedup() {
        return this.storage.getItem("backedup");
    }

    async startBackup(password) {
        if(!this.isBackedup()) {
            let entropy = this.storage.getItem("entropy");
            entropy = utils.sha256PWDecrypt(password, entropy);
            let seed = bip39.entropyToMnemonic(entropy);
            return seed;
        }
    }

    async backup(password, mnemonic) {
        let self = this;
        return new Promise(async function(resolve, reject) {
            try {
                let _seed = self.storage.getItem("seed");
                _seed = utils.sha256PWDecrypt(password, _seed)
                let seed = bip39.mnemonicToSeedHex(mnemonic);
                if(seed == _seed) {
                    self.storage.setItem("backedup", true);
                    self.storage.save(password);
                    resolve(true);
                } else {
                    reject(new Error("Mnemonic did not match"))
                }
            } catch(e) {
                reject(e)
            }
                
        });
    }

    async getIPFS(options) {
      const self = this;
      return new Promise( async function(resolve, reject) {
        try {
          options = options || {}
          options = await utils.mergeOptions(defaultIpfsOptions, options);
          options.config = self.storage.getItem("ipfs")
          const ipfs = new IPFS(options)
          resolve(ipfs);
        } catch(e) {
          reject(e);
        }
          

      });

    }

    async orbitID() {
      const self = this;
      return new Promise(function(resolve, reject) {
        let keys = self.storage.getItem("orbitdb")
        try {
          let key = ec.keyPair({
            priv:keys.privateKey,
            pub:keys.publicKey,
            pubEnc:'hex',
            privEnc:'hex'
          })
          let id = key.getPublic("hex");
          resolve(id)

        } catch(e) {
          reject(e)
        }
      })
    }

    async orbitIdentity(keystore, peerID) {
      const self = this;
      return new Promise(async function(resolve, reject) {
        try {

          let options = {}
          options.id = peerID;
          options.keystore = keystore;
          options.type="orbitdb";
          let id = keystore.getKey(peerID).getPublic("hex");
          let identity = await Identities.createIdentity({id:peerID, keystore:keystore, type:'orbitdb'})
          resolve(identity)

        } catch(e) {
          reject(e);
        }
      })
    }

    async getOrbitDB(ipfs, options) {
      const self = this;
      return new Promise(async function(resolve, reject) {
        try {
          options = options || {}
          const peerID = (ipfs._peerInfo ? ipfs._peerInfo.id._idB58String : 'default')
          const orbitstorage = new storage.BlankStore()
          orbitstorage.setItem(peerID, JSON.stringify(self.storage.getItem("orbitdb")))
          let orbitID = await self.orbitID()
          orbitstorage.setItem(orbitID, JSON.stringify(self.storage.getItem("orbitdb")))
          const keystore = new Keystore(orbitstorage);
          let identity = await self.orbitIdentity(keystore, peerID)
          let defaultOptions = {}
          defaultOptions.keystore = keystore
          defaultOptions.id = peerID;
          defaultOptions.identity = identity
          options = await utils.mergeOptions(defaultOptions, options)
          const orbitdb = OrbitDB.createInstance(ipfs,options);

          resolve(orbitdb);
        } catch(e) {
          reject(e);
        }
      })


    }

    async passwordForSite(password, site, num, length) {
      const self = this;
      num = num || 0
      if(num != 0) {
        num += 1
      }
      length = length ||10
      return new Promise(async function(resolve, reject) {
        try {
          let seed = self.storage.getItem("seed");
          seed = utils.sha256PWDecrypt(password, seed)
          let site_hash = sha256(site);
          let site31 = utils.xmur31(site_hash)
          let account_type = utils.xmur31(sha256("passwords"))
          let node = bip32.fromSeed(Buffer.from(seed, "hex"));
          let path = "m/44'/" + account_type + "'/"+ site31 +"'/0/" + num
          let site_key = node.derivePath(path).privateKey.toString("hex");
          site_key = new BN(site_key, "hex")
          let site_bn = new BN(site_hash, "hex")
          let password_hash = site_key.mod(site_bn).toString("hex")
          //password = await utils.passwordFromSeed(password_hash, length, chars)
          let result = await Password(password_hash, length)
          resolve(result)
        } catch(e) {
          reject(e)
        }
      })
    }

}


module.exports = Wallet;