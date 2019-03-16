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
    const orbitdb = await await wallet.getOrbitDB(ipfs);
    const db = await orbitdb.log('hello')

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
    let gpassword = await wallet.passwordForSite(password, "google.com",1)
    console.log("Password for google", gpassword)

    
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
if your password should be compromised and you need a new password you can increment the 3rd arugment which is password index. There is no storage required for this since we derive keys based on a 256 hash of the site name provided. 
The proposed derivation path would follow the bip44 standard like this:
 m / 44' / 60' / account' / change / address_index

 where 44 is the stanard(bip44)
 where 60 is the type(etherum, bitcoin, rsa, website, etc)
 where account is the xmur3 hash of the sha256 hash of the website name
 where address_index is the number of password
 change is always 0

 I suggest xmur31(sha256("passwords")) for the type which is 1626018612. This allows for virtually inifinte types in the HD tree
 we do this again for the website. So google.com is: 1191255504, facebook: 591925166, etc. utils.xmur31 generates a 32 bit number from a given string and then returns that mod max 31 bit integer. The reason for this is hardened keys require a max of 31bit numbers. 

 the derivation path for the first password at google.com would be
 m/44'/1626018612'/1191255504'/0/0
 the second password should the first get compromised:
 m/44'/1626018612'/1191255504'/0/1
 and so on. 
```javascript
password = "password";
let gpassword = await wallet.passwordForSite(password, "google.com",1)
console.log("Password for google", gpassword)
```