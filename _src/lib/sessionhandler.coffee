RedisSessions = require( "redis-sessions" )
SessionObject = require( "./sessionobject" )

module.exports = class SessionHandler
	constructor: ( options = {}, @connect )->
		if options.app? and ( _apptype = typeof options.app ) in [ "string", "function" ]
			if _apptype is "function"
				@getApp = options.app
			else
				@getApp = @_defaultGetApp( options.app )
		else
			@_error( "no-app-defined" )
			return
		@app = options.app
		
		@utils = connect.utils

		@rds = new RedisSessions( options )
		@redis = @rds.redis

		if options.debug
			@debug = true
		else
			@debug = false

		@ready = false
		@redis.on "connect", => @ready = true
		@redis.on "disconnect", => @ready = false

		@trustProxy = options.proxy
		@cookie = options.cookie or {}
		@ttl = options.ttl

		return

	_defaultGetApp: ( app )=>
		return ( req, cb )=>
			cb( null, app )

	_error: ( key, cb )=>
		if typeof key is "string" 
			_err = new Error()
			_err.name = key
			_err.message = @ERRORS[ key ] if @ERRORS[ key ]?
		else
			_err = key

		if cb?.constructor?.name is "ServerResponse"
			cb.statusCode = 500
			cb.end(_err.toString())
			console.error( "cannot get appname", _err, _err.stack )
		else if cb? and typeof cb is "function"
			cb( _err )
		else
			throw _err
		return

	generate: ( req, token, id )=>
		req.sessionID = token
		req.session = new SessionObject( @, req, @_redisToSession( id: id, ip: @_getRequestIP( req ) ) )
		req.res.on "header", @_setCookie( req )
		return

	createSession: ( req, sess )=>
		#_exp = sess.cookie.expires
		#_oma = sess.cookie.originalMaxAge
		#sess.cookie = new @connect.session.Cookie( @cookie )
		#sess.cookie.expires = new Date( _exp ) if "string" is typeof _exp
		req.session = new SessionObject( @, req, sess )
		return req.session

	_setCookie: ( req )=>
		return =>
			return if not req.session
			cookie = new @connect.session.Cookie( @cookie )

			proto = (req.headers['x-forwarded-proto'] or '').split(',')[0].toLowerCase().trim()
			tls = req.connection.encrypted or ( @trustProxy and 'https' is proto)

			if cookie.secure and not tls
				console.warn( "not secured" ) if @debug
				return 

			# long expires, handle expiry server-side
			if cookie.hasLongExpires
				console.log( "allready set cookie" ) if @debug
				return

			# browser-session length cookie
			if not cookie.expires?
				if not isNew 
					console.log( "already set browser-session cooki" ) if @debug
					return

			# compare hashes and ids
			else if req._originalHash is req.session.hash() and req._originalId is req.session.id
				console.log( "unmodified session" ) if @debug
				return

			val = cookie.serialize( req._appname, req.sessionID)

			req.res.setHeader('Set-Cookie', val)

			return

	_remCookie: ( req )=>
		return =>
			return if not req.session
			cookie = new @connect.session.Cookie( @cookie )
			cookie.expires = new Date(0)
			val = cookie.serialize( req._appname, req.sessionID )

			req.res.setHeader('Set-Cookie', val)
			return


	_getRequestIP: ( req )=>
		if req.headers?['X-Forwarded-For']?
			return req.headers['X-Forwarded-For']
		else
			return req.connection.remoteAddress

	create: ( req, id, cb )=>
		@rds.create { app: req._appname, ttl: @ttl, id: id, ip: @_getRequestIP( req ) }, ( err, data )=>
			return cb( err ) if err
			cb( null, data.token )
			return
		return

	get: ( req, cb )=>
		@rds.get { app: req._appname, token: req.sessionID }, ( err, data )=>
			return cb( err ) if err
			console.log "GOT", data if @debug
			if data? and Object.keys( data ).length isnt 0
				cb( null, @_redisToSession( data )) if cb
			else
				cb( null, null ) if cb	
			return

		return

	set: ( req, cb )=>
		_args = 
			app: req._appname
			token: req.sessionID

		_attrs = req.session.attributes()
		if Object.keys( _attrs ).length isnt 0
			_args.d = req.session.attributes()
		else
			_args.d = {}
		@rds.set _args, ( err, data )=>
			return cb( err ) if err
			if data? and Object.keys( data ).length isnt 0
				cb( null, @_redisToSession( data )) if cb
			else
				cb( null, null ) if cb	
			return
		return

	_redisToSession: ( data )=>
		_sess = {}
		for _k, _v of data.d or {}
			_sess[ _k ] = _v
		
		_sess._meta = 
			id: data.id or null
			r: data.r or 1
			w: data.w or 1
			ttl: data.ttl or @ttl or 7200
			idle: data.idle or 0
			ip: data.ip or ""

		_sess

	destroy: ( req, cb )=>
		@rds.kill { app: req._appname, token: req.sessionID }, ( err, data )=>
			return cb( err ) if err
			cb( null, data.kill or 0 ) if cb	
			return
		return

	killIdSessions: ( req, cb )=>
		@rds.killsoid { app: req._appname, id: req.session._meta.id }, ( err, data )=>
			return cb( err ) if err
			cb( null, data.kill or 0 ) if cb	
			return
		return

	getAppSessions: ( req, dt = 600, cb )=>
		@rds.soapp( { app: req._appname, dt: dt }, cb )
		return

	getIdSessions: ( req, cb )=>
		@rds.soid( { app: req._appname, id: req.session._meta.id }, cb )
		return

	getAppActivity: ( req, dt = 600, cb )=>
		@rds.activity( { app: req._appname, dt: dt }, cb )
		return

	ERRORS: 
		"no-token": "This is an invalid or outdated session"
		"no-app-defined": "To initialize a ConnectRedisSessions object you have to define the option `app` as a string or function"
		"cookies-disabled": "The cookieParser has not been initialized. Please add `connect.cookieParser()` to your connect/express configuration."
