crc32 = require('buffer-crc32')

module.exports = class Session
	constructor: ( handler, req, data )->
		Object.defineProperty( @, "req", { value: req } )
		Object.defineProperty( @, "handler", { value: handler } )
		Object.defineProperty( @, "id", { value: req.sessionID } )
		Object.defineProperty( @, "d", { get: @attributes } )

		if 'object' is typeof data
			for _k, _v of data
				@[ _k ] = _v
		return

	upgrade: ( id, ttl, cb )=>
		# validate arguments
		if typeof ttl is "function"
			# case: no ttl
			cb = ttl
			ttl = null
		else if ttl?
			# case: with ttl
			# validate ttl
			if typeof ttl isnt 'number'
				ttl = parseInt( ttl, 10 )
				ttl = null if isNaN( ttl ) 
			else
				ttl = null

		if ttl? and ttl < 10
			console.warn "Tried to use `ttl < 10`! So Reset ttl to `10`."
			ttl = 10

		if @id?
			cb() if cb?
			return
		@handler.create @req, id, ttl, ( err, token )=>
			return cb( err ) if cb? and err
			console.log "NEW TOKEN", token if @handler.debug
			@handler.generate( @req, token, id, ttl )
			cb() if cb?
			return
		return @

	attributes: =>
		_ret = {}
		for _k, _v of @
			_ret[ _k ] = _v if _k isnt "_meta" and ( _v is null or typeof _v in [ "string", "number", "boolean" ] )
		return _ret

	#touch: =>@resetMaxAge()

	#resetMaxAge: =>
	#	@cookie.maxAge = @cookie.originalMaxAge
	#	return @

	save: ( cb = -> )=>
		if not @id
			@handler._error( "no-token", cb )
			return @
		
		@handler.set( @req, cb )
		return @

	reload: ( cb = -> )=>
		if not @id
			@handler._error( "no-token", cb )
			return @
		@handler.get @id, ( err, sess )=>
			return cb( err ) if err
			@handler._error( "session-load" ) if not sess?
			@handler.createSession( req, sess )
			cb()
			return
		return @

	destroy: ( cb )=>
		if not @id?
			@handler._error( "no-token", cb )
			return @

		@id = null
		@handler.destroy @req, ( err, data )=>

			res = @req.res

			_writeHead = res.writeHead
			res.writeHead = =>
				@handler._remCookie( @req )
				_writeHead.apply( res, arguments )
				return

			cb( err, data ) if cb?
			return  
			
		return @

	# TODO: check the mechanic behind the standard node session.regenerate()
	# regenerate: ( cb )=>
	# 	if not @id
	# 		@handler._error( "no-token", cb )
	# 		return @

	# 	@handler.regenerate( @req, fn )
	# 	return @

	hash: ()=>
		return crc32.signed( JSON.stringify( @attributes() ) )

	destroyall: ( cb )=>
		if not @id?
			@handler._error( "no-token", cb )
			return @

		@id = null
		@handler.killIdSessions @req, ( err, data )=>
			
			res = @req.res
			
			_writeHead = res.writeHead
			res.writeHead = =>
				@handler._remCookie( @req )
				_writeHead.apply( res, arguments )
				return

			cb( err, data ) if cb?
			return
		return @

	activity: =>
		if not @id
			@handler._error( "no-token", cb )
			return @
		[ args..., cb ] = arguments

		@handler.getAppActivity( @req, args[ 0 ], cb )
		return

	soapp: =>
		if not @id
			@handler._error( "no-token", cb )
			return @
		[ args..., cb ] = arguments

		@handler.getAppSessions( @req, args[ 0 ], cb )
		return

	soid: ( cb )=>
		if not @id
			@handler._error( "no-token", cb )
			return @
		@handler.getIdSessions( @req, cb )
		return  

	getRedisSessionsModule: =>
		return @handler.rds


crc32 = require('buffer-crc32')