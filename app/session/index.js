'use strict';
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('../config');
const db = require('../db');

// We have to use signed session cookies that are hashed

if(process.env.NODE_ENV === 'production'){
	module.exports = session({
		secret: config.sessionSecret,
		resave: false,
		saveUninitialized: false,
		store: new MongoStore({
			// refers to mongo db instance and connects to it
			mongooseConnection: db.Mongoose.connection
		})
	})
} else {
	module.exports = session({
		secret:  config.sessionSecret,
		// if set to true, it will continually try to store the session data
		// even though the session data hasn't changed. Not good, too much db request
		resave: false,
		// create a session cookie in the session browser and store even though it
		// hasn't been initialized. In production though, we would set this to true
		// so there aren't superfluous calls to the database
		saveUnitialized: true
	})
}