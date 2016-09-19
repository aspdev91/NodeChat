'use strict';
const config = require('../config');
const logger = require('../logger');
const Mongoose = require('mongoose').connect(config.dbURI);


// Log an error if the connection fails
Mongoose.connection.on('error', error => {
	// W4 Direct the errors to winston, see console.log replacement
	logger.log('error','Mongoose connection error ' + error);
	// console.log("MongoDB Error: ", error);
})

// Create a Schema that defines the structure for storing user data
const chatUser = new Mongoose.Schema({ 
	profileId: String,
	fullName: String,
	profilePic: String
})

// Turn the schema into a usable model
let userModel = Mongoose.model('chatUser',chatUser);

module.exports = {
	Mongoose,
	userModel
}