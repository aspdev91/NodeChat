'use strict';

const config = require('./config');
// R3) Provides a client UI to interact with Redis
const redis = require('redis').createClient;
const adapter = require('socket.io-redis');
// the router is a middleware function
// const router = require('express').Router();

// router.get('/',(req,res,next) => {
// 	res.render('login');
// });

// if you're handling multiple http requests for a single route

// router.route('/process')
// 	.get((req,res,next) => {
// 		res.send('page_get');
// 	})
// 	.post((req,res,next) => {
// 		res.send('page_post')
// 	})

// S1) Create an IO Server Instance
let ioServer = app => {
	// S8) We're establishing the chatroom var in express to track the chatrooms in array form
	// It stores it all in memory, need alternative method for storing data store
	app.locals.chatrooms = []
	// bind in our express app
	// S4) The express app is binded to our server here instead of the server.js file
	const server = require('http').Server(app);
	// invoke its constructor with the server instance
	// S6) brings in all the socket io code 
	const io = require('socket.io')(server);
	// this require statement brings in and executes all the socketio code
	// we're going to mount in middleware for the io
	// R7) Force server side socket io to only use web socket, no long polling
	io.set('transports'['websocket']);
	// R4) instantiates a client IF using pubClient, used for send and publishing data buffers
	let pubClient = redis(config.redis.port, config.redis.host, {
		auth_pass: config.redis.password 
	})
	// R5) Used to subscribe/ get data from redis
	// We need to set up two seperate interfaces
	let subClient = redis(config.redis.port, config.redis.host, {
		return_buffers: true,
		// We want the data in original state, not in string form if this was false
		auth_pass: config.redis.password
	})
	// R6) Hooks up redis clients with socket.io
	io.adapter(adapter({
		pubClient,
		subClient
	}))
	// S9) Create a middleware function, this runs for every socket instance that connects to the server
	// Allows you to access the socket.request ata
	io.use((socket,next) => { 
		// fetch the active profile from the session
		// bridges the active session with socket io
		require('./session')(socket.request, {}, next);
	})
	require('./socket')(io, app);
	return server;

	// 
}

require('./auth')();

module.exports = {
	router: require('./routes')(),
	session: require('./session'),
	// S2) Export this!
	ioServer,
	logger: require('./logger')
}