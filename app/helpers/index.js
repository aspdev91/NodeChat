'use strict'

const router = require('express').Router();
const db = require('../db');
const crypto = require('crypto');
var dateFormat = require('dateformat');
var watson = require('watson-developer-cloud');
var config = require('../config');


// this is all the helper functions, private and public functions

// by adding the underscore, we're making this a private function
let _registerRoutes = (routes,method) => {
	for(let key in routes) {
		// checks if key is an object, not null, and not an array 
		if(typeof routes[key] === 'object' && routes[key] !== null && !(routes[key] instanceof Array)){
			_registerRoutes(routes[key],key);
		} else {
			// Register the routes
			if( method === 'get'){
				router.get(key, routes[key]);
			} else if (method === 'post'){
				router.post(key, routes[key]);
			} else {
				// used for routes that have undefined methods 
				// NA will fall into this condition
				// this is a middleware function 
				router.use(routes[key])
			}
		}
	}
}

let route = routes => {
	_registerRoutes(routes);
	return router;
}

// Finds a single user based on a key
let findOne = profileID => {
	return db.userModel.findOne({
		'profileId': profileID
	});
}

let createNewUser = profile => {
	return new Promise((resolve,reject) => {
		let newChatUser = new db.userModel({
			uniqueUserId: randomHex(),
			profileId: profile.id,
			fullName: profile.displayName,
			profilePic: profile.photos[0].value || '',
			emotionScores: {
				anger: 0,
				disgust: 0,
				fear: 0,
				joy: 0,
				sadness: 0
			},
			socialScores: {
				openness: 0,
				conscientiousness: 0,
				extraversion: 0,
				agreeableness: 0,
				emotional_range: 0
			},
			messageCount: 0
		});
		newChatUser.save(error => {
			if(error) {
				console.log('Create New User Error');
				reject(error);
			} else {
				resolve(newChatUser);
			}
		})
	});
}

let createNewRoomMDB = newRoom => {
	return new Promise((resolve,reject) => {
		let newChatRoom = new db.chatRoomModel({
			roomID: newRoom.roomID,
			room: newRoom.room,
			users: [],
			creationDate: newRoom.creationDate
		})
		newChatRoom.save(error => {
			if(error){
				console.log('Create New Room not saved');
				reject(error)
			} else {
				resolve(newChatRoom)
			}
		})
	})
}

let retrievePastRoomsMDB = () => {
	return new Promise((resolve,reject) => {
		db.chatRoomModel.find({$query: {}, $orderby: {$natural : -1}}, (error,pastChatRooms) => {
			if(error){
				reject(error);
			} else {
				resolve(pastChatRooms);
			}
		})
	})
}

let createNewSpUser = profile => {
	return new Promise((resolve,reject) => {
		let newChatUser = new db.userModel({
			profileId: profile.id,
			fullName: profile.displayName,
			profilePic: profile.photos[0] || ''
		});
		newChatUser.save(error => {
			if(error) {
				console.log('Create New User Error');
				reject(error);
			} else {
				resolve(newChatUser);
			}
		})
	})
}

// The ES6 promisified version of findById

let findById = id => {
	return new Promise((resolve,reject) => {
		db.userModel.find({"userID": id}, (error,user) => {
			if(error){
				console.log('findById',error);
				reject(error);
			} else {
				resolve(user);
			}
		})
	})
}

let isAuthenticated = (req,res,next) => {
	if(req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/')
	}
}

// S34) Create a helper function to find the chatroom by name

let findRoomByName = (allrooms, room) => {
	// findIndex is a new ES6 function that finds the index of the room matching
	// -1 is returned if it can't be found in any index
	let findRoom = allrooms.findIndex((element,index,array) => {
		if(element.room === room ){
			return true;
		} else {
			return false;
		}
	})
	// if findRoom has an index, return true
	return findRoom > -1 ? true : false;
}

// S35) Generate a unique room ID 

let randomHex = () => {
	return crypto.randomBytes(24).toString('hex');
}

// S41) Find a chatroom with a givenID
let findRoomById = (allrooms,roomID) => {
	// the find function will return the element room if the callback is true
	return allrooms.find((element,index,array) => {
		if(element.roomID === roomID){
			return true;
		} else {
			return false;
		}
	})
}

// S47) create this function to add a user to a chatoom
let addUserToRoom =(allrooms,data,socket) => {
	// Get the room object
	let getRoom = findRoomById(allrooms, data.roomID);
	console.log('getRoom',getRoom)
	if (getRoom !== undefined) {
		// Get the active user's ID (ObjectID as used in session)
		// We can't rely on socket id since that's constantly changing or profile name or id due to
		// duplicates
		let userID = socket.request.session.passport.user;
		// Check to see if this user already exists in the chatroom
		let checkUser = getRoom.users.findIndex((element,index, array) => {
			if(element.userID === userID){
				return true;
			} else {
				return false;
			}
		});

		// If the user is already present in the room, remove him first
		if(checkUser > -1){
			// delete the user using the index provided by CheckUser
			getRoom.users.splice(checkUser, 1);
		} 

			// Otherwise push the user into the room's users array
		getRoom.users.push({
			socketID: socket.id,
			userID,
			user: data.user,
			userPic: data.userPic
		});
		
		// S48) Join the room channel, allows the user to allow send messages within that single
			// chatroom
		socket.join(data.roomID)
		// Return the updated room object
		return getRoom;
	}
}

// S55) Run removeUserFromRoom

let removeUserFromRoom = (allrooms, socket) => {
	let findUser = -1;
	for(let room of allrooms){
		findUser = room.users.findIndex((element,index,array) => {
			if(element.socketID === socket.id){
				return true;
			} else {
				return false;
			}
 		})

 		if(findUser > -1){
		// native socket syntax to leave, unsubscribes socket from the channel
			socket.leave(room.roomID);
			room.users.splice(findUser, 1);
			return room;
		} 
	}
}

let storeNewMessage = data => {
	return new Promise((resolve,reject) => {
		let newChatMessage = new db.chatMessageModel({
			userID: data.userID,
			chatContent: data.message,
			roomID: data.roomID,
			creationDate: dateFormat(Date.now(), "isoDateTime"),
			userPic: data.userPic,
			emotionScores: data.analysis.document_tone.tone_categories[0].tones,
			socialScores: data.analysis.document_tone.tone_categories[2].tones
		})
		newChatMessage.save(error => {
			if(error){
				reject(error);
			} else {

				resolve(newChatMessage)
			}
		})
	})	
}

let analyzeMessage = message => {
	return new Promise((resolve,reject) => {
		var tone_analyzer = watson.tone_analyzer({
		  username: config.ibm.username,
		  password: config.ibm.password,
		  version: 'v3',
		  version_date: '2016-05-19'
		});

		tone_analyzer.tone({ text: message },
		 function(err, tone) {
		    if (err)
		      reject(err);
		    else
		      resolve(tone);
		});
	})
}

let retrieveChatMessages = roomID => {
	return new Promise((resolve,reject) => {
		db.chatMessageModel.find({"roomID": roomID}, (error,pastMessages) => {
			if(error){
				reject(error);
			} else {
				resolve(pastMessages);
			}
		})
	})
}

let updateUserScores = data => {
	return new Promise((resolve,reject) => {
		console.log('this is the data user id',data)
		db.userModel.find({"profileId" : data.userID},(error,userData) => {

			if(error){
				console.log('Rrror while updating scores: ',error)
			}

			for(let emotionScore in data.emotionScores){
				console.log(emotionScore)
				userData.emotionScores[emotionScore] = ((userData.emotionScores.emotionScore * userData.messageCount) + data.emotionScores.emotionScore)/(userData.messageCount + 1)
			}
			// for(let socialScore in data.socialScores){
			// 	userData.emotionScore = ((userData.emotionScore * userData.messageCount) + data.analysis.document_tone.tone_categories.tones[emotionScore])/(userData.messageCount + 1)
			// }
			userData.messageCount += 1
		})
			console.log('new userData',userData)
	})
}

module.exports = {
	// ES6	
	route,
	findOne,
	createNewUser,
	createNewRoomMDB,
	retrievePastRoomsMDB,
	createNewSpUser,
	findById,
	isAuthenticated,
	findRoomByName,
	randomHex,
	findRoomById,
	addUserToRoom,
	removeUserFromRoom,
	storeNewMessage,
	retrieveChatMessages,
	analyzeMessage,
	updateUserScores
}