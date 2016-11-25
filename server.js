'use strict';

const express = require('express');
const passport = require('passport');
const app = express();
const NodeChat = require('./app'); 
// sets the port automatically passed from Heroku or 3000 by default when thats unavailable
app.set('port',process.env.PORT || 3000);
app.set('view engine','ejs');
app.use(express.static('public'))

app.use(NodeChat.session);	
app.use(passport.initialize());
app.use(passport.session());
// Outputs logs using morgan, date, http, etc is combined format
app.use(require('morgan')('combined', {
	// Stream the files to Winston
	stream: {
		write: message => {
			//Write to logs
			NodeChat.logger.log('info',message)
		}
	}
}));
app.use('/',NodeChat.router); 


// Replace app with ioServer and inject the express app instance here
NodeChat.ioServer(app).listen(app.get('port')), () => {
	console.log('ChatCat Running on Port:', 3000);
}

