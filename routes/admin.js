//set up express object and its dependencies
const express = require('express');
const session = require('express-session');
const admin = express.Router()
const path = require('path')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const { Client } = require('../controller/utils')

// Create database object
let authenticationDatabase;   // this database collection holds the most recent admin log in information
// connect to database
Client.connect(err => {
    if (err) {
      console.error('Could not connect to MongoDB database for admin router!');
    } else {
      console.log('Admin Router connected to MongoDB database successfully');
      authenticationDatabase = Client.db().collection('auth_base');
    }
})

// set up path to .env file
require('dotenv').config({path: path.join(__dirname, '..', '.env')});
admin.use(cookieParser())

//set up session middleware
admin.use(session({secret: "jets", saveUninitialized: true, resave: true}))

//variable to track sessions with
let sessionID = process.env.SESSION_ID || '0XB245367';

//validates the log in entries for the admin page
admin.post('/log-in', async (request, response) => {
    console.log(request.secret)
    if(request.body.username === process.env.ADMIN_USERNAME && request.body.password === process.env.ADMIN_PASSWORD){
      console.log(`Successful Admin log in confirmed. Time: ${new Date().toLocaleString()}`)
      sessionID = request.session.id
      try {
          await authenticationDatabase.deleteMany({});
          await authenticationDatabase.insertOne({sessionID: sessionID});
          response.cookie("AdminToken", sessionID);
          response.send({status: "success", message: "Authentication successfull"});
      } catch(e) {
          console.error(e)
          response.status(500).send({status: 'failed', message: 'database error'});
      }
      
    }
    else{
      console.log(`Failed Admin log in. Time: ${new Date().toLocaleString()}`)
      response.send({status: "failed", message: "wrong details given."})
    }
})

//cancels present session and redirect to log in page is triggered
admin.get('/log-out', (request, response) => {
  request.session.destroy( error => {
    if(error){
      console.error(error)
      console.log(`Admin log out failed. Time: ${new Date().toLocaleString()}`)
      response.send({status: "failed"})
    }
    else {
      console.log(`Successful Admin log out confirmed. Time: ${new Date().toLocaleString()}`)
      sessionID = process.env.SESSION_ID || '0XB245367';
      response.send({status: "success", message: "Logged out successfully"})
    }
  })
})


module.exports = { admin, sessionID }