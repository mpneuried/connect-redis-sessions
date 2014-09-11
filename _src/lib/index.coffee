SessionHandler = require( "./sessionhandler" )
SessionObject = require( "./sessionobject" )
pause = require( "pause" )

module.exports = ( options )->
	sessionHandler = new SessionHandler( options )

	fn = ( req, res, next )->
		if not req.res?
			req.res = res

		return next() if req.session			

		if not sessionHandler.ready
			console.warn( "Connection not ready" ) if sessionHandler.debug
			next()
			return

		# pathname mismatch
		return next() if req.originalUrl.indexOf( sessionHandler.cookie.path or "/" )

		sessionHandler.getApp req, ( err, appname )=>
			if err
				sessionHandler._error( err, res )
				return

			req._appname = appname

			console.log( "use appname: ", appname ) if sessionHandler.debug

			if not req.cookies?
				sessionHandler._error( "cookies-disabled", res )
				return

			if req.cookies[ appname ]?
				req.sessionID = req.cookies[ appname ]
			else
				req.sessionID = null

			end = res.end
			res.end = ( data, encoding )=>
				res.end = end
				return res.end( data, encoding ) if not req.sessionID or not req.session?
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

				_pause = pause(req)
				sessionHandler.get req, ( err, data )=>
					_next = next
					next = ( err )->
						_next( err )
						_pause.resume()

					if err
						console.log "GET ERROR", err if sessionHandler.debug
						req.sessionID = null
						req.session = new SessionObject( sessionHandler, req )
						next()
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
		
	fn.handler = sessionHandler
	return fn