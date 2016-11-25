'use strict';
const config = require('../config');
const logger = require('../logger');
const Mongoose = require('mongoose').connect(config.dbURI);


// Log an error if the connection fails
Mongoose.connection.on('error', error => {
	logger.log('error','Mongoose connection error ' + error);
	// console.log("MongoDB Error: ", error);
})



const chatUser = new Mongoose.Schema({ 
	uniqueUserId: String,
	profileId: String,
	fullName: String,
	profilePic: String,
	emotionScores: Object,
	socialScores: Object,
	messageCount: Number
})


const chatRoom = new Mongoose.Schema({ 
	roomID: String,
	room: String,
	users: Array,
	creationDate: String
})

const chatMessage = new Mongoose.Schema({
	userID: String, 
	chatContent: String,
	roomID: String,
	creationDate: String,
	userPic: String,
	emotionScores: Array,
	socialScores: Array
})

// Turn the schema into a usable model
let userModel = Mongoose.model('chatUser',chatUser);
let chatRoomModel = Mongoose.model('chatRoom',chatRoom);
let chatMessageModel = Mongoose.model('chatMessage',chatMessage);

module.exports = {
	Mongoose,
	userModel,
	chatRoomModel,
	chatMessageModel
}