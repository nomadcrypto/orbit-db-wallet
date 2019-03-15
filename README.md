# orbit-db-wallet
This package contains a wallet that creates a wallet for ipfs, orbitdb based on a bip39 seed phrase. It AES encrypts those keys based on a user supplied pass phrase and saves them in localstorage. In the future I may move from localstorage to IndexedDB for storage. 

## Example Usage
You can view the code in examples/example.js
```javascript
//hack for annoying bitcore error involving more than instance. They have something odd going on in their 
//package requirements setup
Object.defineProperty(global, '_bitcore', { get(){ return undefined }, set(){} })
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
const orbitWallet = require("../index");
const Wallet = orbitWallet.Wallet;
const storage = orbitWallet.storage;
const KeyStore = orbitWallet.Keystore;



password = "password";

const wallet = new Wallet(password);
if(!wallet.isSetup()) {
	//setup wallet here
	var phrase = "praise you muffin lion enable neck grocery crumble super myself license ghost";
	//var phrase = wallet.generateMnemonic();
	wallet.restoreFromMnemonic(phrase,password).then(function(result) {
		console.log(wallet.storage.items);
	}).catch(function(err) {
		console.log(err)
	});
} else {
	const ipfsOptions = {
	    EXPERIMENTAL: {
	      pubsub: true
	    },
	    config:wallet.storage.getItem("ipfs")
	}

	const ipfs = new IPFS(ipfsOptions)
	ipfs.on("error", (e) => console.error(e))
	ipfs.on('ready', async () => {
		const peerID = (ipfs._peerInfo ? ipfs._peerInfo.id._idB58String : 'default')
		const orbitstorage = new storage.BlankStore()
  		orbitstorage.setItem(peerID, JSON.stringify(wallet.storage.getItem("orbitdb")))
  		const keystore = new KeyStore(orbitstorage);
  		let options = {}
  		options.keystore=keystore;
  		const orbitdb = new OrbitDB(ipfs, "./test" + Math.random(), options);

  		const db = await orbitdb.create("test", 'eventlog', {
  			write: [
  				orbitdb.key.getPublic("hex")
  			]
  		})

  		db.load()
	  	db.events.on('replicated', (address) => {
	    	console.log(db.iterator({ limit: -1 }).collect())
	  	})

	  	// Add an entry
	  	const hash = await db.add('hello world')
	  	console.log(hash)

	  	// Query
	  	const result = db.iterator({ limit: -1 }).collect()
	 	console.log(JSON.stringify(result, null, 2))
	})
}
```