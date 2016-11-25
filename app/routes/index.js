'use strict';

const h = require('../helpers')
const passport = require('passport');
const config = require('../config');

module.exports = () => {
	let routes = {
		'get': {
			'/': (req,res,next) => {
				res.render('login');
			},
			// by setting isAuthenticated here, it checks with passport
			// if the user is logged in
			'/rooms':[h.isAuthenticated,(req,res,next) => {
				res.render('rooms', {
					user: req.user,
					// S16) sets the host to the response
					host: config.host
				});
			}],
			'/chat/:id': [h.isAuthenticated,(req, res, next) => {
				
				let getRoom = h.findRoomById(req.app.locals.chatrooms, req.params.id);
				if(getRoom === undefined){
					console.log('check routes, cannot getRoom')
					return next();
				} else {
					console.log('this is req.user',req.user)
					res.render('chatroom',{
						user: req.user,
						host: config.host,
						room: getRoom.room,
						roomID: getRoom.roomID
					});
				}
			}],
			'/auth/facebook': passport.authenticate('facebook'),
			// we need to set a callback to redirect user upon success or failure
			'/auth/facebook/callback': passport.authenticate('facebook', {
				successRedirect: '/rooms',
				failureRedirect: '/'
			}),
			'/auth/spotify': passport.authenticate('spotify',{scope: ['user-read-email', 'user-read-private','user-library-read','user-library-modify','user-follow-modify','playlist-modify-private','playlist-read-private'] }),
			'/auth/spotify/callback': passport.authenticate('spotify', {
				successRedirect: '/rooms',
				failureRedirect: '/'
			}),
			'/logout': (req,res,next) => {
				// made available by passport, clears out the session
				// removes req user variable
				req.logOut();

				res.redirect('/');
			}
		},
		'post': { 

		},
		'NA': (req,res,next) => {
			// status method is a express helper function
			// if we use dirname, we are pulling the full pwd of this file location
			// if we use process cwd, we get the origin path of where the  code was
			// originally ran which is server.js
			res.status(404).sendFile(process.cwd() + '/views/404.htm');
		}
	} 

	return h.route(routes);
	// returns a function which is envoked in the importing module
}

