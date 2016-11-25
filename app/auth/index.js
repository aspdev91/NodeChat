'use strict';
const passport = require('passport');
const config = require('../config');
const h = require('../helpers');
const FacebookStrategy = require('passport-facebook').Strategy;
// const SpotifyStrategy = require('passport-spotify').Strategy;
const logger = require('../logger');

module.exports = () => {

	passport.serializeUser((user,done)=> {
		console.log(user.id);
		done(null,user.id)
	})

	passport.deserializeUser((id, done) => {
		// Find the user using the _id
		h.findById(id)
			.then(user => done(null,user))
			.catch(error => logger.log('error','Error when deserializing the user' + error));
	})xz

	let authFbProcessor = (accessToken, refreshToken, profile, done) => {
		// Find a user in the local db using profile.id
		h.findOne(profile.id)
			.then(result => {
				if(result){
					// this is usually set to error, but set to null for other reasons
					done(null, result);
				} else{ 
					// Create a new user
					h.createNewUser(profile)
						.then(newChatUser => {
							done(null,newChatUser)
						})
				}
			})
		// If the user is found, return the user data using the done()
		// If the user is not found, create one in the local db and return 
	};

	// let authSpProcessor = (accessToken, refreshToken, profile, done) => {
	// 	console.log(profile);
	// 	console.log(accessToken);
	//     // User.findOrCreate({ spotifyId: profile.id }, function (err, user) {
	//     //   return done(err, user);
	//     // });
		
	// 	h.findOne(profile.id)
	// 		.then(result => {
	// 			if(result){
	// 				// this is usually set to error, but set to null for other reasons
	// 				done(null, result);
	// 			} else{ 
	// 				// Create a new user
	// 				console.log("1 ",profile)
	// 				h.createNewSpUser(profile)
	// 					.then(newChatUser => {
	// 						console.log("2 ",newChatUser)
	// 						return done(null,newChatUser)
	// 					})
	// 			}
			// })
	    // User.findOrCreate({ spotifyId: profile.id }, function (err, user) {
	    //   if(err){console.log(err)};
	    //   console.log(user);
	    //   return done(err, user);
	    // });
	// }


	passport.use(new FacebookStrategy(config.fb, authFbProcessor));
	// passport.use(new SpotifyStrategy(config.sp, authSpProcessor));
}