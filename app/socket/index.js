'use strict';
const h = require('../helpers');
const db = require('../db');
var dateFormat = require('dateformat');
// 
 module.exports = (io, app) => {
 	// We're storing all the data to chatroom
 	// allows us to create application variables in express using app.locals
 	// app.locals is accessible in when using any req or app variable
 	
 	let allrooms = app.locals.chatrooms;

 	// Lets manually push in the rooms variable for testing purposes
 	// allrooms.push({
 	// 	room: 'Good Food',
 	// 	roomID: '0001',
 	// 	users: []
 	// });

 	//  allrooms.push({
 	// 	room: 'Mikes Test',
 	// 	roomID: '0002',
 	// 	users: []
 	// })
 
 	io.of('/roomslist').on('connection', socket => {

 		socket.on('getChatRooms', () => {
 			// Add rooms to allrooms list from MongoDB
 			h.retrievePastRoomsMDB()
			.then(pastChatRooms => {
				app.locals.chatrooms = pastChatRooms
				allrooms = pastChatRooms
				socket.emit('chatRoomsList', JSON.stringify(allrooms))
			})

 			// Emits the ChatRoomsList with the allrooms variable pushed out to the client
 			
 		});
 		// Create a new event listener for createNewRoom
 		socket.on('createNewRoom',newRoomInput => {
 			// Check if the room exists, if not create one 
 			if(!h.findRoomByName(allrooms, newRoomInput)) {
 				let newRoom = {
 					room: newRoomInput,
 					// Check helper function for 
 					roomID: h.randomHex(), 
 					users: [],
 					creationDate: dateFormat(Date.now(), "isoDateTime")
 				}
 				// Save chatroom instance to MongoDB
 				h.createNewRoomMDB(newRoom);
 				allrooms.push(newRoom)
 			}

 			

 			// Push allrooms to the creator
 			socket.emit('chatRoomsList', JSON.stringify(allrooms))
 			// Pushes allrooms to everyone connected to the rooms page using the "broadcast" syntax
 			socket.broadcast.emit('chatRoomsList',JSON.stringify(allrooms));
 		})
 	})

 	// We will need to set up a pipeline for the chatter 

 	io.of('/chatter').on('connection',socket => {
 		socket.on('join', data => {
 			// Sets usersList to the result of this helper function
 			let usersList = h.addUserToRoom(allrooms, data, socket) || 	[];
 			// Broadcast the new user out to everyone and also the user who just joined
 			socket.broadcast.to(data.roomID).emit('updateUsersList', JSON.stringify(usersList.users)) // equivalent of socket.broadcast.to
 			// Provide user with old messages
 			h.retrieveChatMessages(data.roomID)
 				.then(pastChatMessages => {
 					socket.emit('updateMessageList', JSON.stringify(pastChatMessages));
 				})
 			// We need to also update the list for the user who just loggedin
 			socket.emit('updateUsersList', JSON.stringify(usersList.users));
 		})
 		// In case the user disconnects, run this helper function
 		socket.on('disconnect', () => {
 			let room = h.removeUserFromRoom(allrooms, socket) || [];
 			// socket.emit('chatRoomsList', JSON.stringify(room))
 			socket.broadcast.to(room.roomID).emit('updateUsersList', JSON.stringify(room.users));
 			// No need to send it to the user of origin so the user already left
 		})
 		socket.on('newMessage',data => {
 				h.analyzeMessage(data.message)
 				.then( result => {
 					data.analysis = result;
 					h.storeNewMessage(data)
 						.then(() => {
 							h.updateUserScores(data)
 								.then(() => {
 									socket.emit('inMessage', JSON.stringify(data));	
 									socket.broadcast.to(data.roomID).emit('inMessage', JSON.stringify(data));	
 								})	
 						})
 				})

 		})
 	});
 }