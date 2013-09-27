SessionHandler = require( "./sessionhandler" )
SessionObject = require( "./sessionobject" )

module.exports = ( connect, options )->
	Cookie = connect.session.Cookie
	#Session = connect.session.Session
	utils = connect.utils

	sessionHandler = new SessionHandler( options, connect )

	return ( req, res, next )->
		if not req.res?
			req.res = res

		return next() if req.session			

		if not sessionHandler.ready
			console.warn( "Connection not ready" ) if sessionHandler.debug
			next()
			return

		# pathname mismatch
		return next() if req.originalUrl.indexOf( sessionHandler.cookie.path or "/" )

		# backwards compatibility for signed cookies
		# req.secret is passed from the cookie parser middleware
		secret = @secret or req.secret

		# ensure secret is available or bail
		sessionHandler._error( "no-secret", res ) if not sessionHandler.secret
		
		sessionHandler.getApp req, ( err, appname )=>
			if err
				sessionHandler._error( err, res )
				return

			req._appname = appname

			console.log( "use appname: ", appname ) if sessionHandler.debug

			if not req.cookies?
				sessionHandler._error( "cookies-disabled", res )
				return
			rawCookie = req.cookies[ appname ]
			unsignedCookie = req.signedCookies[ appname ]
			if not unsignedCookie and rawCookie
				unsignedCookie = utils.parseSignedCookie( rawCookie, sessionHandler.secret )

			req._unsignedCookie = unsignedCookie
			req.sessionID = unsignedCookie;

			end = res.end
			res.end = ( data, encoding )=>
				res.end = end
				return res.end( data, encoding ) if not req.sessionID
				#req.session.resetMaxAge()
				if req._originalHash isnt req.session.hash()
					req.session.save ( err )=>
						console.error( err ) if err
						res.end( data, encoding )
						return
				else
					res.end( data, encoding )
					return


				return

			if not appname?.length
				console.log("no appname defined so run next") if sessionHandler.debug
				req.sessionID = null
				req.session = new SessionObject( sessionHandler, req )
				next()
				return
			if not req.sessionID
				console.log("no SID found so run next") if sessionHandler.debug
				req.sessionID = null
				req.session = new SessionObject( sessionHandler, req )
				next()
				return
			else

				pause = utils.pause(req)
				sessionHandler.get req, ( err, data )=>
					_next = next
					next = ( err )->
						_next( err )
						pause.resume()
					if err
						next( err )
						return

					if not data?
						req.sessionID = null
						req.session = new SessionObject( sessionHandler, req )
						next()
						return

					console.log "SESSION found", data if sessionHandler.debug
					sessionHandler.createSession( req, data )
					req._originalHash = req.session.hash()
					req._originalId = req.session.id
					next()
					return
			return

		return