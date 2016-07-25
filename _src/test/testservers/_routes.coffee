module.exports = ( app, DEBUG )->
	
	app.use ( req, res )->
		if req.query.noop?
			res.end( "EMPTY" )
			return

		if req.query.upgrade? and req.query.ttl?
			req.session.upgrade req.query.upgrade, req.query.ttl, ( err )->
				if err
					res.end( "ERROR: ", err )
					return
				console.log "SESSION", req.session if DEBUG
				res.end( "LOGGED IN - USER: #{ req.session?._meta?.id}" )
				return
			return
			
		if req.query.upgrade?
			req.session.upgrade req.query.upgrade, ( err )->
				if err
					res.end( "ERROR: ", err )
					return
				console.log "SESSION", req.session if DEBUG
				res.end( "LOGGED IN - USER: #{ req.session?._meta?.id}" )
				return
			return
			
		if req.session?.id? and req.query.destroy?
			req.session.destroy ( err, ok )->
				if err
					res.end( "ERROR: #{err}" )
					return
				res.end( "killed + #{ok}" )
				return
			return
			
		if req.session?.id? and  req.query.save?

			for _k, _v of req.query when _k isnt "save"
				if _v?.length and _v isnt "null"
					req.session[ _k ] = _v
				else
					req.session[ _k ] = null
			res.end(  "USER: #{ req.session?._meta?.id}\n" + "SAVED: #{ JSON.stringify( req.session.attributes() )}" )
			return

		if req.session?.id? and  req.query.soapp?

			req.session.soapp ( err, data )->
				if err
					res.end( "ERROR: #{err}" )
					return
				res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
				return
			return

		if req.session?.id? and  req.query.soid?

			req.session.soid ( err, data )->
				if err
					res.end( "ERROR: #{err}" )
					return
				res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
				return
			return

		if req.session?.id? and  req.query.activity?

			req.session.activity ( err, data )->
				if err
					res.end( "ERROR: #{err}" )
					return
				res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
				return
			return

		if req.session?.id? and req.query.destroyall?

			req.session.destroyall ( err, data )->
				if err
					res.end( "ERROR: #{err}" )
					return
				res.end( "USER: #{ req.session?._meta?.id}\n" + JSON.stringify( data ) )
				return
			return

		
		if req.session.id
			console.log "SESSION", req.session.d.r if DEBUG
			res.end( "USER: #{ req.session?._meta?.id}" )
			return
			
		res.end( "UNKOWN" )

		return
	
	return app
