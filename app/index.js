'use strict';

const config = require('./config');

const redis = require('redis').createClient;
const adapter = require('socket.io-redis');

let ioServer = app => {

	app.locals.chatrooms = []
	const server = require('http').Server(app);
	const io = require('socket.io')(server);
	io.set('transports'['websocket']);
	// Instantiates a client IF using pubClient, used for send and publishing data buffers
	let pubClient = redis(config.redis.port, config.redis.host, {
		auth_pass: config.redis.password 
	})
	// Used to subscribe/ get data from redis
	// We need to set up two seperate interfaces
	let subClient = redis(config.redis.port, config.redis.host, {
		return_buffers: true,
		// We want the data in original state, not in string form if this was false
		auth_pass: config.redis.password
	})
	// Hooks up redis clients with socket.io
	io.adapter(adapter({
		pubClient,
		subClient
	}))
	// Create a middleware function, this runs for every socket instance that connects to the server
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
	ioServer,
	logger: require('./logger')
}