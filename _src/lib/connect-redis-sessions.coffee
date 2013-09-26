RedisSessions = require( "redis-sessions" )
signature = require('cookie-signature')
uid = require('uid2')
crc32 = require('buffer-crc32')
signature = require('cookie-signature')

module.exports = ( connect )->
	Cookie = connect.session.Cookie
	Session = connect.session.Session
	utils = connect.utils

	class Session
		constructor: ( @store, req, data )->
			Object.defineProperty( @, "req", { value: req } )
			Object.defineProperty( @, "id", { value: req.sessionID } )
			utils.merge(@, data) if 'object' is typeof data
			return

		touch: =>@resetMaxAge()

		resetMaxAge: =>
			@cookie.maxAge = @cookie.originalMaxAge
			return @

		save: ( cb = -> )=>
			@store.set( @id, @, cb )
			return @

		reload: ( cb = -> )=>
			@store.get @id, ( err, sess )=>
				return cb( err ) if err
				@store._error( "session-load" ) if not sess?
				@store.createSession( req, sess )
				cb()
				return
			return @

		destroy: ( cb )=>
			delete @req.session
			@store.destroy( @id, cb )
			return @

		regenerate: ( cb )=>
			@store.regenerate( @req, fn )
			return @




	return class ConnectRedisSessions
		constructor: ( options = {} )->
			###
			if not options.app? and typeof options.app isnt "string"
				@_error( "no-app-defined" )
				return
			@app = options.app
			###

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
			@key = options.key or "redissessions.sid"
			@secret = options.secret

			return	

		middleware: ( req, res, next )=>
			return next() if req.session			

			if not @ready
				console.warn( "Connection not ready" ) if @debug
				next()
				return

			# pathname mismatch
			return next() if req.originalUrl.indexOf( @cookie.path or "/" )

			# backwards compatibility for signed cookies
			# req.secret is passed from the cookie parser middleware
			secret = @secret or req.secret

			# ensure secret is available or bail
			@_error( "no-secret" ) if not secret
			
			# grab the session cookie value and check the signature
			rawCookie = req.cookies[@key]

			# get signedCookies for backwards compat with signed cookies
			unsignedCookie = req.signedCookies[@key]

			if not unsignedCookie and rawCookie
				unsignedCookie = utils.parseSignedCookie( rawCookie, @secret )

			originalHash = null
			originalId = null 

			#set cookie
			res.on "header", =>
				return if not req.session

				cookie = req.session.cookie
				proto = (req.headers['x-forwarded-proto'] or '').split(',')[0].toLowerCase().trim()
				tls = req.connection.encrypted or ( @trustProxy and 'https' is proto)
				isNew = unsignedCookie isnt req.sessionID

				if cookie.secure and not tls
					console.warn( "not secured" ) if @debug
					return 

				# long expires, handle expiry server-side
				if not isNew and cookie.hasLongExpires
					console.log( "allready set cookie" ) if @debug
					return

				# browser-session length cookie
				if not cookie.expires?
					if not isNew 
						console.log( "already set browser-session cooki" ) if @debug
						return
				# compare hashes and ids
				else if originalHash is @hash( req.session ) and originalId is req.session.id
					console.log( "unmodified session" ) if @debug
					return

				_signed = signature.sign( req.sessionID, @secret )
				val = cookie.serialize( @key, _signed)

				res.setHeader('Set-Cookie', val)
				return

			# proxy end method and save the session before call of end
			end = res.end
			res.end = ( data, encoding )=>
				res.end = end
				return res.end( data, encoding ) if not req.session
				req.session.resetMaxAge()
				req.session.save ( err )=>
					console.error( err.stack ) if err
					res.end( data, encoding )
					return
				return

			# get the sessionID from the cookie
			req.sessionID = unsignedCookie

			if not req.sessionID
				console.log("no SID sent, generating session") if @debug
				@generate( req )
				next()
				return

			# genearte the session object
			pause = utils.pause(req)
			if req.sessionID[ 0 ] is "u:"
				# it's a non logged in session so return simple
				originalId = req.sessionID
				req.session
				originalHash = @hash( req.session or {} )
				next()
			else
				# it's an redis-session session so store it
				next()

			return

		hash: ( sess )=>
			_strg = JSON.stringify sess, ( key, val )->
				return val if key isnt "cookie"
			console.log "hash", _strg, sess
			return crc32.signed( _strg )
		
		generate: ( req, hasID = false )=>
			_uid = uid(24)
			# this is just a marker
			req.sessionID = ( if hasID then "k:" else "u:" ) + _uid
			req.session = new Session( @, req)
			req.session.cookie = new Cookie( @cookie )
			console.log "GENERATED"
			return

		# Store methods

		createSession: ( req, sess )=>
			_exp = sess.cookie.expires
			_oma = sess.cookie.originalMaxAge
			sess.cookie = new Cookie( @cookie )
			sess.cookie.expires = new Date( _exp ) if "string" is typeof _exp
			sess.originalMaxAge = _oma
			req.session = new Session( @, req, sess )
			return req.session

		regenerate: ( req, cb )=>
			@destory req.sessionID, ( err )=>
				@generate( req )
				cb( err )
				return
			return

		# SessionStore Methods

		getKey: ( sid )=>
			@prefix + sid
			return 

		get: ( sid, cb )=>
			console.log "GET", arguments
			@rdSession.get { app: @app, token: sid }, ( err, data )=>
				return cb( err ) if err
				console.log "GOT", data
				if data.d
					cb( null, JSON.parse( data.d ) ) if cb
				else
					cb( null ) if cb	
				return

			return

		setID: ( sid,  cb )=>
			@rdSession.create { app: @app, ttl: 60 * 60, id: id, }, ( err, data )=>
				return cb( err ) if err
				cb() if cb
				return
			return

		set: ( sid, sess, cb )=>


			cb()
			
			return

		destroy: ( sid, cb )=>
			console.log "DESTORY", arguments
			return

		length: ( cb )=>
			console.log "LENGTH", arguments
			return

		clear: ( cb )=>
			console.log "CLEAR", arguments
			return

		_error: ( key, cb )=>
			_err = new Error()
			_err.name = key
			_err.message = @ERRORS[ key ] if @ERRORS[ key ]?
			if cb? and typeof cb is "function"
				cb( _err )
			else
				throw _err
			return

		ERRORS: 
			"no-secret": "There is no secret define within the options"
			"no-app-defined": "To initialize a ConnectRedisSessions object you have to define the option `app` as a string"