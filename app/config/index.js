'use-strict';

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
			"clientID": "93c445bff70342718d88029c3d8c7f71",
			"clientSecret": "f89b569a06814c618b7d98609ab726a3",
			"callbackURL": process.env.host + "/auth/spotify/callback"
		},
		// R2) Set up redis configs with the derived password, port, and hostname
		redis: {
			host: redisURI.hostname,
			port: redisURI.port,
			password: redisPassword
		}
	}
} else {
	module.exports = require('./development.json');
}