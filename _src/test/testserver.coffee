connect = require( "connect" )
ConnectRedisSessions = require( "../" )

app = connect()

_getAppName = ( req, cb )=>
	appname = req._parsedUrl.pathname.split( "/" )[ 1 ]
	if appname?
		cb( null, appname )
	else
		cb( null )
	return

app
	.use( connect.logger( "dev" ) )
	.use(connect.query())
	.use(connect.cookieParser())
	.use(connect.bodyParser())
	.use( ConnectRedisSessions( connect, { secret: 'mysecret', app: _getAppName, debug: true, cookie: { maxAge: 1000 * 60 * 60 * 24 } } ) )
	#.use(connect.session( secret: 'mysecret', cookie: { maxAge: 1000 * 60 } ))
	#.use(connect.session( secret: 'mysecret', cookie: { maxAge: 1000 * 60 },  store: new ConnectRedisSessions( app: "test") ))

app.use ( req, res )->

	#console.log req.session
	if req.query.upgrade?
		req.session.upgrade req.query.upgrade, ( err )=>
			if err
				res.end( "ERROR: ", err )
				return
			console.log req.session
			res.end( "LOGGED IN - USER: #{ req.session._meta.id}" )
			return
	else if req.query.destroy?
		req.session.destroy ( err, ok )=>
			console.log "AFTER DEST", err, ok
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( "killed + #{ok}" )
			return
	else if req.query.save?

		for _k, _v of req.query when _k isnt "save"
			req.session[ _k ] = _v
		res.end( "ERROR: #{ JSON.stringify( req.session.attributes() )}" )
		return

	else if req.query.soapp?

		req.session.soapp ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( JSON.stringify( data ) )
			return
		return

	else if req.query.soid?

		req.session.soid ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( JSON.stringify( data ) )
			return
		return

	else if req.query.activity?

		req.session.activity ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( JSON.stringify( data ) )
			return
		return

	else if req.query.destroyall?

		req.session.destroyall ( err, data )=>
			if err
				res.end( "ERROR: #{err}" )
				return
			res.end( JSON.stringify( data ) )
			return
		return

	else
		console.log "SESSION", req.session.id
		if req.session.id
			res.end( "USER: #{ req.session._meta.id}" )
		else
			res.end( "UNKONWN" )

	return

app.listen( 3005 )
