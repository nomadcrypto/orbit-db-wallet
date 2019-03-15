# orbit-db-wallet
This package contains a wallet that creates a wallet for ipfs, orbitdb based on a bip39 seed phrase. It AES encrypts those keys based on a user supplied pass phrase and saves them in localstorage. In the future I may move from localstorage to IndexedDB for storage. 

## Example Usage
You can view the code in examples/example.js
```javascript
//hack for annoying bitcore error involving more than instance. They have something odd going on in their 
//package requirements setup
Object.defineProperty(global, '_bitcore', { get(){ return undefined }, set(){} })
const orbitWallet = require("../index");
const Wallet = orbitWallet.Wallet;


async function example(wallet) {
  //do example stuff here
  const ipfs = await wallet.getIPFS()
  ipfs.on("error", (e) => console.error(e))
  ipfs.on('ready', async () => {
    const orbitdb = await wallet.getOrbitDB(ipfs, "./test" + Math.random())
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


password = "password";
const wallet = new Wallet(password);

if(!wallet.isSetup()) {
  //our seed phrase
  var phrase = "praise you muffin lion enable neck grocery crumble super myself license ghost";
  //or geneate a new random one
  //var phrase = wallet.generateMnemonic();
  wallet.restoreFromMnemonic(phrase, password).then(function() {
    //run our example now that we're setup
    example(wallet);
  }).catch(function(e) {
    console.error(e)
  })

} else {
  example(wallet);
}
```