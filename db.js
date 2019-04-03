const IPFS = require('ipfs-api');
const OrbitDB = require('orbit-db');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');
const config = require('./config');
const addressGenerator = require('./utils/genkey');
const signMessage = require('./utils/sign');
const verifyMessage = require('./utils/verify');

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  },
  relay: {
      enabled: true, hop: {
          enabled: true, active: true
        }
    },
  host: 'localhost',
  port: '5001'
};

// Create IPFS instance
const ipfs = new IPFS(ipfsOptions);
const orbitdb = new OrbitDB(ipfs);

// load all dbs
let userDb = null;
let userContactsDb = null;
let userEmailsDb = null;

async function loadDB() {
	//db = await orbitdb.docs('todo1');
	try {
        // loads all db
        if(config.user !== null && config.contacts !== null && config.emails !== null) {
            userDb = await orbitdb.open(config.user);
            userContactsDb = await orbitdb.open(config.contacts);
            userEmailsDb = await orbitdb.open(config.emails);
        } else {
            // create dbs
			userDb = await orbitdb.create('email.user','docstore',{
				write: ['*']
            });

            userContactsDb = await orbitdb.create('email.user.contacts','docstore',{
				write: ['*']
            });

            userEmailsDb = await orbitdb.create('email.user.data','docstore',{
				write: ['*']
            });
		}
	}	
	catch(e) {
		console.log(e);		
	}
	// load the local store of the data
	userDb.events.on('ready', () => {
		console.log('user database is ready.')
	});

	userDb.events.on('replicate.progress', (address, hash, entry, progress, have) => {
		console.log('user database replication is in progress');
	});

	userDb.events.on('replicated', (address) => {
		console.log('user database replication done.');
    });
    
    userContactsDb.events.on('ready', () => {
		console.log('user contacts database is ready.')
	});

	userContactsDb.events.on('replicate.progress', (address, hash, entry, progress, have) => {
		console.log('user contacts database replication is in progress');
	});

	userContactsDb.events.on('replicated', (address) => {
		console.log('user contacts replication done.');
    });
    
    userEmailsDb.events.on('ready', () => {
		console.log('user emails database is ready.')
	});

	userEmailsDb.events.on('replicate.progress', (address, hash, entry, progress, have) => {
		console.log('user emails database replication is in progress');
	});

	userEmailsDb.events.on('replicated', (address) => {
		console.log('user emails databse replication done.');
	});
	
    userDb.load();
    userContactsDb.load();
    userEmailsDb.load();
}
loadDB();

async function addUser() {
    try {
        let id = uuid();
        let password = bcrypt.hashSync(data.password,10);
        let addressData = addressGenerator();
        let data = {
            _id: id,
            email: data.email,
            password: password,
            publicKey: addressData.publicKey,
            privateKey: addressData.privateKey,
            time: Date.now()
        }
        let hash = await userDb.put(data);
        console.log(hash);
        let userData = userDb.get(id);
        console.log(userData);
        return {
            "error": false,
            "hash": hash
        }
    }
    catch(e) {
        return {
            "error": true,
            "hash": null
        }
    }
}

async function login(data) {
    try {
        let userData = getUserByEmail(data.email);
        if(bcrypt.compareSync(data.password,userData[0].password)) {
            // correct password
            return {
                "error": false,
                "data": {
                    "userId": userData[0]['_id'],
                    "email": userData[0]['email']
                },
                "message": "user logged in successfully."
            }
        } else {
            return {
                "error": true,
                "data": null,
                "message": "password does not match"
            }
        }
    }
    catch(e) {
        return {
            "error": true,
            "data": null,
            "message": "error occurred during login"
        }
    }
}

async function getUserContacts(data) {
    try {
        let userContactData = userContactsDb.query((doc) => doc.userId === data.userId);
        return {
            "error": false,
            "data": userContactData,
            "message": "Success"
        };
    }
    catch(e) {
        return {
            "error": true,
            "data": null,
            "message": "failure"
        };
    }
}

async function userContactAction(data) {
    try {
        let contactData = await searchContact(data.userId, data.contactEmail);
        let action = null;
        if(data.action === 'approve') {
            action = 1;
        }
        if(data.action === 'reject') {
            action = 2;
        }
        let updateData = {
            _id: contactData['_id'],
            userId: data.userId,
            contactEmail: data.contactEmail,
            contactId: contactData.contactId,
            contactPubkey: contactData.contactPubkey,
            status: action,
            time: Date.now()
        }
        let hash = await userContactsDb.put(updateData);
        console.log(hash);
        return {
            "error": false,
            "hash": hash,
            "message": "Success"
        };
    }
    catch(e) {
        return {
            "error": true,
            "hash": null,
            "message": "Failure"
        };
    }
}

async function getUserByEmail(email) {
    let data = userDb.query((doc) => doc.email === email);
    return data;
}

async function getEmails(email) {
    let data = userEmailsDb.query((doc) => doc.to === email);
    return data;
}

async function searchContact(userId, email) {
    let data = userContactsDb.query((doc) => doc.userId === userId && doc.contactEmail === email);
    return data;
}

async function addUserContact(data) {
    try {
        let id = uuid();
        let fetchContactData = getUserByEmail(data.contactEmail);
        let contactData = {
            _id: id,
            userId: data.userId,
            contactEmail: data.contactEmail,
            contactId: fetchContactData.userId,
            contactPubkey: fetchContactData.publicKey,
            status: 0,
            time: Date.now()
        }
        let hash = await userContactsDb.put(contactData);
        console.log(hash);
        let contactDataFetch = userContactsDb.get(id);
        console.log(contactDataFetch);
        return {
            "error": false,
            "hash": hash,
            "message": "Success"
        };
    }
    catch(e) {
        return {
            "error": true,
            "hash": null,
            "message": "Failure"
        };
    }
}

async function sendEmail(data) {
    // here shahid sending email to ash by encrypting the message with shahid's private key and ash's public key
    try {
        let id = uuid();
        let senderData = await getUserByEmail(data.from);
        let reciepentData = await getUserByEmail(data.to);
        let email = data.email;
        let signatureData = signMessage(email, {privateKey: senderData[0].privateKey, publicKey: reciepentData[0].publicKey});
        let emailData = {
            _id: id,
            from: data.from,
            to: data.to,
            email: signatureData.data,        
            signature: signatureData.nonce,
            readStatus: false,
            time: Date.now()
        }
        let hash = await userEmailsDb.put(emailData);
        console.log(hash);
        let emailFetch = userEmailsDb.get(id);
        console.log(emailFetch);
        return {
            "error": false,
            "hash": hash,
            "message": "Success"
        };
    }   
    catch(e) {
        return {
            "error": true,
            "hash": null,
            "message": "Failure"
        };
    }
}

async function getUserEmail(data) {
    try {
        let emailData = await getEmails(data.email);
        return {
            "error": false,
            "data": emailData,
            "message": "Success"
        };
    }
    catch(e) {
        return {
            "error": true,
            "data": null,
            "message": "Failure"
        };
    }
}

async function readEmail(data) {
    try {
        let emailData = userEmailsDb.query((doc) => doc._id === data.id && doc.to === data.email);
        let userData = await getUserByEmail(data.email);
        let senderData = await getUserByEmail(emailData[0].from);
        let decryptEmail = verifyMessage({
            email: emailData[0].email,
            signature: emailData[0].email
        },{
            senderPublicKey: senderData[0].publicKey,
            privateKey: userData[0].privateKey
        });
        return {
            "error": false,
            "data": decryptEmail,
            "message": "Success"
        };
    }
    catch(e) {
        return {
            "error": true,
            "data": null,
            "message": "Failure"
        };
    }
}

/**
 * Check whether the from address is in your contacts, if not reject it right away
 * Otherwise decrypt the email using reciepant private key and sender's public key
 */

async function decodeMail() {        
    let currentUserData = await getUserByEmail('shahid@hashmailer.com');
    let ashData = await getUserByEmail('ash@hashmailer.com');
    let emailData = await getEmails('ash@hashmailer.com');
    let decryptEmail = verifyMessage({email: emailData[0].email, signature: emailData[0].signature}, {senderPublicKey: currentUserData[0].publicKey, privateKey: ashData[0].privateKey});    
    console.log(decryptEmail);
}

module.exports = {
    addUser: addUser,
    login: login,
    getUserContacts: getUserContacts,
    addUserContact: addUserContact,
    userContactAction: userContactAction,
    sendEmail: sendEmail,
    getUserEmail: getUserEmail,
    readEmail:readEmail,
}