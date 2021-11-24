var express = require('express');
var router = express.Router();

const { Client } = require('../controller/utils')

// Create database object
let primaryContractDatabase   // this database collection holds the most recent contract
let backupContractDatabase    // this database collection holds a history of every deleted contract
let authenticationDatabase    // Stores information about most recent admin log in

// connect to database
Client.connect(err => {
  if (err) {
    console.error('Index Router could not connect to MongoDB database!');
  } else {
    console.log('Index Router connected to MongoDB database successfully');
    // stores currency information gotten from third-party APIs
    primaryContractDatabase = Client.db().collection('contract_base');
    backupContractDatabase = Client.db().collection('backup_contract_base');
    authenticationDatabase = Client.db().collection('auth_base');
  }
})

/**
 * @desc This checks if admin session has been authorised. If it is authorised, the request is forwarded, else it gets rejected.
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 */
const AdminAuth = async (request, response, next) => {
  let AdminToken;
  let sessionID;
  try{
    AdminToken = request.cookies["AdminToken"]
    sessionID = await authenticationDatabase.findOne({}) 
  }
  catch(error){
    console.log(error)
  }

  if(sessionID === AdminToken){
    next()
  }
  else{
    response.status(403).send({status: "failed", message: 'unauthorised'});
  }
}

/* GET Contract information and send as response. */
router.get('/contract-information', async function(req, res, next) {
  // Get first contract information from database
  const contract = await primaryContractDatabase.findOne({});

  // if no address is present in info gotten from database, signify that no contract exists
  let isContract;
  if(contract) {
    isContract = true
  } else{
    isContract = false
  }
  // Package object to be sent to frontend
  let obj = {
    status: 'success',
    isContract,
    contract
  }
  
  // send out response
  res.send(obj);
});


/**
 * Insert new contract if no old one exists
 */
router.post('/contract-information', AdminAuth, async function(req, res, next) {
  // get contract information from request body
  const contract = req.body;

  // check if a contract exists in database already
  let check = await primaryContractDatabase.findOne({});

  // if a contract exists already, deny the request
  if(check) {
    res.status(403).send({status: 'unauthorised', message: 'A contract exists already. There can only be one!'})
  }
  // else insert the new contract information to database
  else {
    try {
      await primaryContractDatabase.insertOne(contract);
      res.status(200).send({status: 'success'})
    } catch (e) {
      console.error(e);
      res.status(500).send({status: 'failed', message: 'Internal Server Error'})
    }
  }
})

/**
 * Delete all contracts from database 
 */
router.delete('/contract-information', AdminAuth, async function(req, res, next) {
  try {
    // retrieve all contracts from primary contract base 
    const contracts = await primaryContractDatabase.find({}).toArray();
    // back them up in the backup contract base
    await backupContractDatabase.insertMany(contracts)
    // wipe the primary contract base clean
    await primaryContractDatabase.deleteMany({})
    console.log(`Successfully deleted all Contract Information. Time: ${new Date().toLocaleString()}`)
    res.status(200).send({status: 'success', message: 'Contrat(s) deleted successfully.'})
  } 
  catch (err) {
    console.log(`Tried deleting all contract information and failed. Time: ${new Date().toLocaleString()}`)
    res.status(500).send({status: 'failed', message: 'database error!'})
  }
})

module.exports = router;
