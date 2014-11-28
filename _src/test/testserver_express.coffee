express = require( "express" )
ConnectRedisSessions = require( "../" )

cookieparser = require( "cookie-parser" )
bodyparser = require( "body-parser" )
logger = require( "morgan" )

app = express()

_getAppName = ( req, cb )=>
	appname = req._parsedUrl.pathname.split( "/" )[ 1 ]

	if appname?
		cb( null, appname )
	else
		cb( null )
	return

app
	.use( logger( "dev" ) )
	.use( express.query())
	.use( cookieparser())
	.use( bodyparser())
	.use( ConnectRedisSessions( { app: _getAppName, debug: true, cookie: { maxAge: 1000 * 60 * 60 * 24 } } ) )
	#.use( ConnectRedisSessions( { app: _getAppName, debug: true } ) )
	#.use(express.session( secret: 'mysecret', cookie: { maxAge: 1000 * 60 } ))
	#.use(express.session( secret: 'mysecret', cookie: { maxAge: 1000 * 60 },  store: new ConnectRedisSessions( app: "test") ))

app.use ( req, res )->
	if req.query.noop?
		res.end( "EMPTY" )
		return

	if req.query.upgrade? and req.query.ttl?
		req.session.upgrade req.query.upgrade, req.query.ttl, ( err )=>
			if err
				res.end( "ERROR: ", err )
				return
			console.log "SESSION", req.session
			res.end( "LOGGED IN - USER: #{ req.session?._meta?.id}" )
			return
	else if req.query.upgrade?
		req.session.upgrade req.query.upgrade, ( err )=>
			if err
				res.end( "ERROR: ", err )
				return
			console.log "SESSION", req.session
			res.end( "LOGGED IN - USER: #{ req.session?._meta?.id}" )
			return
	else if req.session?.id? and req.query.destroy?
		req.session.destroy ( err, ok )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( "killed + #{ok}" )
			return
	else if req.session?.id? and  req.query.save?

		for _k, _v of req.query when _k isnt "save"
			req.session[ _k ] = if _v?.length then _v else null
		res.end(  "USER: #{ req.session?._meta?.id}\n" + "SAVED: #{ JSON.stringify( req.session.attributes() )}" )
		return

	else if req.session?.id? and  req.query.soapp?

		req.session.soapp ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
			return
		return

	else if req.session?.id? and  req.query.soid?

		req.session.soid ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
			return
		return

	else if req.session?.id? and  req.query.activity?

		req.session.activity ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
			return
		return

	else if req.session?.id? and req.query.destroyall?

		req.session.destroyall ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
			return
		return

	else
		if req.session.id
			console.log "SESSION", req.session.d.r
			res.end( "USER: #{ req.session?._meta?.id}" )
		else
			res.end( "UNKONWN" )

	return

app.listen( 3005 )
console.log "listen to port 3005"
