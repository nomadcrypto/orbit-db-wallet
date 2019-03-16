const orbitWallet = require("../index");
const Wallet = orbitWallet.Wallet;


async function example(wallet) {
  //do example stuff here
  
  const ipfs = await wallet.getIPFS()
  ipfs.on("error", (e) => console.error(e))
  ipfs.on('ready', async () => {
    //const orbitdb = await wallet.getOrbitDB(ipfs, "./test" + Math.random())
    const orbitdb = await await wallet.getOrbitDB(ipfs);

    /*const db = await orbitdb.create("test", 'eventlog', {
        write: [
            orbitdb.key.getPublic("hex")
        ]
    })*/
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