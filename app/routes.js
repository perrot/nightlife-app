module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
	var user=req.user;
	var username="";
	if(user!=undefined && user.twitter){
		username=user.twitter.displayName;
	}
		if (typeof localStorage === "undefined" || localStorage === null) {
			  var LocalStorage = require('node-localstorage').LocalStorage;
		  localStorage = new LocalStorage('./scratch');
		}
	console.log("------------------------------");
        res.render('index.ejs', {
            username: username,
	    searchtext:localStorage.getItem('location')
        });
	console.log(localStorage.getItem('location'));
	//search(localStorage.getItem('location'),res,req);
    });

    app.post('/', function(req, res) {
	console.log('post home page');
	if(req.user){
	console.log('unser found');
	console.log(req.user);
	console.log(req.user.local.goplaces);
	console.log('=unser found');
	/*
	var User       = require('../app/models/user');
	User.findOne({ 'local.email' :  req.user.local.email}, function(err, user) {
	console.log('=-----------');
	console.log(user);
	console.log(err);
	req.user.local.golist=user.local.golist;
	});*/
	}
	else
	console.log('unser not found');
        //res.render('index.ejs');
	if(req.body.location && req.body.location.length>0){
		if (typeof localStorage === "undefined" || localStorage === null) {
			  var LocalStorage = require('node-localstorage').LocalStorage;
		  localStorage = new LocalStorage('./scratch');
		}
			localStorage.setItem('location', req.body.location);
	console.log(localStorage.getItem('location'));
	console.log('end write');
		search(req.body.location,res,req);
	}
	else if(req.body.place && req.body.place.length>0){
		var text='';
		if(!req.user){ // is a guest
			text="guest";
		}else{
		console.log('req.user');

		console.log(req.user);
		console.log('req.body.go');
		console.log(req.body.go);
		if(req.body.go=="false"){
		req.user.local.goplaces.push(req.body.place);
		text='1 GOING';
		}else{
		req.user.local.goplaces.splice(req.body.index,1);
		text='0 GOING';
		}

		console.log('req.user.local.goplaces');
		console.log(req.user.local.goplaces);
		req.user.local.email=req.user.twitter.username;
		req.user.save(function(err) {
		    console.log('err');
		    console.log(err);
	console.log(req.user);
		});
		}
		console.log('text');
		console.log(text);
		res.json({'text':text,'buttonid':req.body.buttonid});
	}

    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}

function search(str, res,req){
DEFAULT_TERM = 'bars'
DEFAULT_LOCATION = 'San Francisco, CA'
var yelp = require("node-yelp");
 
 
var client = yelp.createClient({
  oauth: {
    "consumer_key": "I47JeOp58fRUnepWrkOC0w",
    "consumer_secret": "DPrPcvnoGZ6yk8Hducyzbs9I0wE",
    "token": "DEAvA-RoPs9YElBTzYyqCRThG1zfvEHE",
    "token_secret": "Wee66JoJRBE3a3FPn4Y0HSk0OKA"
  },
  
  // Optional settings: 
  httpClient: {
    maxSockets: 25  // ~> Default is 10 
  }
});
 
 
client.search({
  term: DEFAULT_TERM,
  location:str
}).then(function (data) {
//console.log('data');
//console.log(data);
  var businesses = data.businesses;
  var location = data.region;
var golist=[];
	for(var i=0;i<businesses.length;i++){
	if(req.user&&req.user.local.goplaces!=undefined){
console.log(i);
console.log(req.user.local.goplaces);
console.log(businesses[i].name);
	if(req.user.local.goplaces.indexOf(businesses[i].name)>-1){
console.log('1 go');
	golist.push("1 GOING");
}	else{
	golist.push("0 GOING");
console.log('0 go');
}
}else{
	golist.push("0 GOING");
}
	}
console.log(golist);
res.json({'places':businesses,'golist':golist});
/*
        res.render('index.ejs', {
            places: businesses
        });
*/
}).catch(function (err) {
console.log('err');
console.log(err);
  if (err.type === yelp.errorTypes.areaTooLarge) {
    // .. 
  } else if (err.type === yelp.errorTypes.unavailableForLocation) {
    // .. 
  }
});


}
