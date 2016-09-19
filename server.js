'use strict';

const express = require('express');
const passport = require('passport');
// invokes express and creates the top level application of express
// can create multiple sub apps to plug into this main express app
const app = express();
const chatCat = require('./app'); // looks at the pages in the app folder
// sets the port automatically passed from Heroku or 3000 by default when thats unavailable
app.set('port',process.env.PORT || 3000);
// you have to set the view engine to ejs 
// EJS is inherit from express, automatically imported module
app.set('view engine','ejs');
// this middleware is from express
// it looks at all the folders in the piblic folder
app.use(express.static('public'))
// middleware has to be declared before the route handlers
// you don't have to set the views folder since express auto does it
// app.set('view','./views')
// let helloMiddleware = (req,res,next) => {
// 	// this effects the req variable before its passed future route handlers
// 	req.hello = "Hello! It's me...";
// 	next();
// }
// // middleware is hooked up to all routes by default
// // we need to plug this in use the app.use method
// app.use('/dashboard',helloMiddleware);
//creating a route handler for the root /
// next processes the next route handler
// app.get('/', (req,res,next) =>{ 
// 	// res.send(`<h1>Hello Express!${req.hello}</h1>`) 
// 	// dirname gets current working directory 
// 	console.log(__dirname);
// 	// serves static file
// 	// doesn't render dynamic data 
// 	// res.sendFile(__dirname + '/views/login.htm');
// 	res.render('login',{
// 		pageTitle: 'My Login Page'
// 	} );
// });
// the session must be mounted before the router
app.use(chatCat.session);	
app.use(passport.initialize());
app.use(passport.session());
// M1) Outputs logs using morgan, date, http, etc is combined format
app.use(require('morgan')('combined', {
	// M2) steam the files to Winston
	stream: {
		write: message => {
			//Write to logs
			chatCat.logger.log('info',message)
		}
	}
}));
app.use('/',chatCat.router); // tells the router middleware to use 

// app.get('/dashboard',(req,res,next) => {
// 	res.send(`<h1>This is a dashboard page! Middleware says </h1>`);
// });

// no need to create an http server
// we're 

// S3) Replace app with ioServer and inject the express app instance here
chatCat.ioServer(app).listen(app.get('port')), () => {
	console.log('ChatCat Running on Port:', 3000);
}

