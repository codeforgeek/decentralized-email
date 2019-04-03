const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();
const db = require('./db');

// add the middleware
app.use(bodyParser.json());

// routers

/**
 * Home page route
 */

 router.get('/',(req,res) => {
     res.send('ok');
     // send html files later
 });

 /**
  * Sign up, add new user
  */

 router.post('/user',async (req,res) => {
     // add new user
     let data = req.body;
     // verify the payload
     let response = await db.addUser(data);
     if(response.error) {
         return res.json({"error": true, "message": "Error adding user."});
     }
     res.json({"error": false, "message": "User added.","hash": response.hash});
 });

 /**
  * Login to the system
  */

  router.post('/login',async (req,res) => {
    let data = req.body;
    let response = await db.login(data);
    if(response.error) {
        return res.json({"error": true, "message": "Invalid user"});
    }
    // add session info here
    res.json({"error": false, "message": "User logged in."});
  });

  /**
   * Get user contacts
   */

   router.get('/user/contacts',(req,res) => {
        // check session and based on user id and email
        // extract the contacts
        let data = req.body; // get the id from session
        let response = await db.getUserContacts(data);
        if(response.error) {
            return res.json({"error": true, "message": "failure"});
        }
        res.json({"error": false, "message": "success", "data": response.data});
   });

   /**
    * Create new contact
    */

   router.post('/user/contacts', async (req,res) => {
        // create a contact request
        let data = req.body;
        let response = await db.addUserContact(data);
        if(response.error) {
            return res.json({ "error": true, "message": "failure" });
        }
        res.json({ "error": false, "message": "success" });
   });

    /**
     * approve/reject the user contact request
     */

    router.post('/user/contacts/action', (req,res) => {
        // get the action such as approve or reject
        // get contact email
        // get user email from the session
        let data = req.body;
        let response = await db.userContactAction(data);
        if(response.error) {
            return res.json({ "error": true, "message": "failure" });
        }
        res.json({ "error": false, "message": "success" });
    });

    /**
     * Send email
     */

    router.post('/email',(req,res) => {
        // get the user id from session
        // grab user credentials
        // check if the unlock key is correct
        // decrypt private key
        // create email instace in the database
        let data = req.body
        // add from address
        let response = await db.sendEmail(data);
        if(response.error) {
            return res.json({ "error": true, "message": "failure" });
        }
        res.json({ "error": false, "message": "success" });        
    });

    /**
     * Get the emails of user
     */

    router.get('/email', (req,res) => {
        // get the user id from session
        // get all emails of that user
        let response = db.getUserEmail(req.session.email);
        if(response.error) {
            return res.json({ "error": true, "message": "failure", "data": response.data });
        }
        res.json({ "error": false, "message": "success", "data": response.data });
    });

    /**
     * Open specific email
     */

    router.get('/email/:id',(req,res) => {
        let data = {
            id: req.params.id,
            email: req.session.email
        };
        let response = await db.readEmail(data);
        if(response.error) {
            return res.json({ "error": true, "message": "failure", "data": response.data });
        }
        res.json({ "error": false, "message": "success", "data": response.data });        
    });

    app.use('/api', router);
    app.listen(process.env.PORT || 3000);
    console.log('Listening on '+(process.env.PORT || 3000)+' port');


