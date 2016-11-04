'use strict';

if(process.env.NODE_ENV === 'production'){
	//Offer production stgae environment variables
	// R1) extract the password from process.env.REDIS_URL
	let redisURI = require('url').parse(process.env.REDIS_URL)
	let redisPassword = redisURI.auth.split(':')[1];
	module.exports = {
		// we will have to configure process.env.host in Heroku
		host: process.env.host || "",
		dbURI: process.env.dbURI,
		sessionSecret: process.env.sessionSecret,
		fb: {
			clientID: process.env.fbClientID,
			clientSecret: process.env.fbClientSecret,
			callbackURL: process.env.host + "/auth/facebook/callback",
			profileFields: ['id','displayName','photos']
		},
		"sp": {
			"clientID": process.env.spClientID,
			"clientSecret": process.env.spClientSecret,
			"callbackURL": process.env.host + "/auth/spotify/callback"
		},
		// R2) Set up redis configs with the derived password, port, and hostname
		redis: {
			host: redisURI.hostname,
			port: redisURI.port,
			password: redisPassword
		},
		"ibm": {
			"username": process.env.ibmUsername,
			"password": process.env.ibmPassword
		}
	}
} else {
	module.exports = require('./development.json');
}