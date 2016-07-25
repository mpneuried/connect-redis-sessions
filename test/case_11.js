var path = require('path');

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ConnectRedisSessions = require('../');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(ConnectRedisSessions({'app':'test', cookie: {ttl: 10000}, debug:true}));

app.use('/', express.Router().get("/cookie", function(req, res, next) {
	if( req.session.id ){
		// session found
		var user_id = req.session._meta.id
		res.send('<b>Express</b> - logged in with user_id:<i>' + user_id + '</i><br/><br/>To exit call <a href="/exit"><code>/exit</code></a>' );
		return
	}
	res.send( '<b>Express</b><br/><br/>To login call <code>/login/:user_id</code>. (<a href="/login/666">example</a>)' )
}));

app.use('/', express.Router().get("/login/:user_id", function(req, res, next) {
	// login the user, which is done by upgrading the session with an id
	req.session.upgrade( req.params.user_id, function( err ){
		if( err ){
			res.status( 500 ).send( err );
		}
		res.redirect( "/cookie" );
	})
}));

app.use('/', express.Router().get("/exit", function(req, res, next) {
	// login the user, which is done by upgrading the session with an id
	req.session.destroy();
	res.redirect( "/cookie" );
}));


app.listen( 3006 );
