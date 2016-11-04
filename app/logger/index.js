'use strict';
// W1) Install winston
const winston = require('winston'); 

// Set up an instance of the winston logger, equivalent to ('./winston/logger').Logger
const logger = new(winston.Logger)({
	// W2) can set where the logs are logged and solve
	transports: [
		// W3 writes a file
		// new(winston.transports.File)({
		// 	level: 'debug',
		// 	filename: './chatCatDebug.log',
		// 	handleExceptions: true
		// }),
		// W5) console log instead
		new (winston.transports.Console)({
			level:'debug',
			json:true,
			handleExceptions: true
		})
	],
	// stop twinston from stopping on error
	exitOnError: false
});

module.exports = logger;