const orbitWallet = require("../index");
const Wallet = orbitWallet.Wallet;
const OrbitDBAccessController = require("orbit-db-access-controllers/src/orbitdb-access-controller")


class OtherAccessController extends OrbitDBAccessController {

  static get type () { return 'othertype' } // Return the type for this controller

  async canAppend(entry, identityProvider) {
    
    // Allow if access list contain the writer's publicKey or is '*'
    const publicKey = entry.v === 0 ? entry.key : entry.identity.publicKey
    console.log("can append", publicKey)
    return false
  }
}



async function example(wallet) {
  //do example stuff here
  
  const ipfs = await wallet.getIPFS()
  ipfs.on("error", (e) => console.error(e))
  ipfs.on('ready', async () => {
    let id = await ipfs.id();
    let AccessControllers = require('orbit-db-access-controllers')
    AccessControllers.addAccessController({ AccessController: OtherAccessController })

    const orbitdb = await wallet.getOrbitDB(ipfs, {AccessControllers: AccessControllers});
    console.log(orbitdb)
    const db = await orbitdb.log('hello2', {
      accessController : {
        type: 'othertype',
        write: [orbitdb.identity.publicKey]
      }
    })

    db.load()
    console.log(db.address)
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