const path = require('path')

// Configure environment variable access
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

// Specify URI for mongodb database access
const MongodbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017'

//  mongodb object to connect with
const MongoClient = require('mongodb').MongoClient
const Client = new MongoClient(MongodbURI, { useNewUrlParser: true, useUnifiedTopology: true })

module.exports = { Client }