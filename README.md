# orbit-db-wallet
This package contains a wallet for ipfs, orbitdb and any other site based on a bip39 seed phrase. It AES encrypts those keys based on a user supplied pass phrase and saves them in localstorage. In the future I may move from localstorage to IndexedDB for storage. 

## Example Usage for IPFS and OrbitDB
You can view the code in examples/example.js
```javascript

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

## Example usage as site password store
if your password should be compromised and you need a new password you can increment the 3rd arugment which is "num". There is no storage required for this since we derive keys based on a 256 hash of the site name provided. 
```javascript
password = "password";
let gpassword = await wallet.passwordForSite(password, "Google.com",1)
console.log("Password for google", gpassword)
```