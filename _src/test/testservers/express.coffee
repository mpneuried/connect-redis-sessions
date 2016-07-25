express = require( "express" )
ConnectRedisSessions = require( "../../" )

cookieparser = require( "cookie-parser" )
bodyparser = require( "body-parser" )
logger = require( "morgan" )


app = express()

_getAppName = ( req, cb )->
	appname = req._parsedUrl.pathname.split( "/" )[ 1 ]

	if appname?
		cb( null, appname )
	else
		cb( null )
	return

DEBUG = if process.env.DEBUG? then true else false
if process.env.LOG?
	app
		.use( logger( "dev" ) )

app
	.use( express.query() )
	.use( cookieparser() )
	.use( bodyparser() )
	.use( ConnectRedisSessions( { app: _getAppName, debug: DEBUG, cookie: { maxAge: 1000 * 60 * 60 * 24 } } ) )

require( "./_routes" )( app, DEBUG )

module.exports = app
