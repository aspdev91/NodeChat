'use strict';
const h = require('../helpers');
// 
// S5) create this anonymous function, brings in our io instance and express app instance
 module.exports = (io, app) => {
 	// S7) We're storing all the data to chatroom
 	// allows us to create application variables in express using app.locals
 	// app.locals is accessible in when using any req or app variable
 	
 	let allrooms = app.locals.chatrooms;

 	// S19) lets manually push in the rooms variable for testing purposes
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
 	// which is connected to the rooms view html/ejs file
 	// S13) we are now listening on the roomsList pipeline in our socket io connection
 	// the on keyword allows for event listeners to listen on this socket
 	io.of('/roomslist').on('connection', socket => {

 		// S24) Configure the getChatRooms socket trigger here in the server (async)
 		socket.on('getChatRooms', () => {
 			
 			// S25) Emits the ChatRoomsList with the allrooms variable pushed out to the client
 			socket.emit('chatRoomsList', JSON.stringify(allrooms))
 		});
 		// S32) Create a new event listener for createNewRoom
 		socket.on('createNewRoom',newRoomInput => {
 			// S33) Check if the room exists, if not create one 
 			if(!h.findRoomByName(allrooms, newRoomInput)) {
 				allrooms.push({
 					room: newRoomInput,
 					// Check helper function for 
 					roomID: h.randomHex(), 
 					users: []
 				})
 			}
 			// S36) push allrooms to the creator
 			socket.emit('chatRoomsList', JSON.stringify(allrooms))
 			// S37) pushes allrooms to everyone connected to the rooms page using the "broadcast" syntax
 			socket.broadcast.emit('chatRoomsList',JSON.stringify(allrooms));
 		})
 	})

 	// S44) We will need to set up a pipeline for the chatter 

 	io.of('/chatter').on('connection',socket => {
 		socket.on('join', data => {
 			// S46) Sets usersList to the result of this helper function
 			let usersList = h.addUserToRoom(allrooms, data, socket) || [];
 			console.log(usersList)
 			// S49) Broadcast the new user out to everyone and also the user who just joined
 			socket.broadcast.to(data.roomID).emit('updateUsersList', JSON.stringify(usersList.users)) // equivalent of socket.broadcast.to
 			// We need to also update the list for the user who just loggedin
 			socket.emit('updateUsersList', JSON.stringify(usersList.users));
 		})
 		// S54) In case the user disconnects, run this helper function
 		socket.on('disconnect', () => {
 			let room = h.removeUserFromRoom(allrooms, socket) || [];
 			socket.emit('chatRoomsList', JSON.stringify(room))
 			socket.broadcast.to(room.roomID).emit('updateUsersList', JSON.stringify(room.users));
 			// No need to send it to the user of origin so the user already left
 		})
 		// S58) Listener for event key
 		socket.on('newMessage',data => {
 			console.log('server',data)
 			socket.broadcast.to(data.roomID).emit('inMessage', JSON.stringify(data));
 		})
 	});
 }