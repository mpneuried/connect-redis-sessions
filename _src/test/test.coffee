should = require('should')
querystring = require('querystring')
rand = require('randoms')

request = require( "request" )

SERVERS =
	connect: require( "./testservers/connect" )
	express: require( "./testservers/express" )

PORT = process.env.PORT or 3005

HOST = "http://localhost:#{PORT}/"


req = ( [app, data, jar]..., cb )->
	
	_uri = HOST
	
	if app?.length
		_uri += app + "/"
		
	_qs = querystring.stringify( data ) if data? and Object.keys( data )?.length
	if _qs?.length
		_uri += "?" + _qs

	_opt =
		uri: _uri
		method: "GET"
		
	if jar?
		_opt.jar = jar
	
	request _opt, ( err, resp, body )->
		if err
			throw err
			return
		cb( body )
		return
	return
	

describe "----- connect resid sessions TESTS -----", ->
	
	for _servername, app of SERVERS
		describe "#{_servername.toUpperCase()} Tests - ", ->
			server = null
			
			apps =
				A: rand.string.lower(10)
				B: rand.string.lower(10)
			
			uids =
				A: rand.string.alphaNum(5)
				B: rand.string.alphaNum(5)
				C: rand.string.alphaNum(5)
				D: rand.string.alphaNum(5)
				
			jars = {}
			for _k, uid of uids
				jars[ _k ] = request.jar()
			
			before ( done )->
				server = app.listen PORT, ->
					done()
					return
				return

			after ( done )->
				server.close( done )
				return
			
			# Implement tests cases here
			it "first check", ( done )->
				req null, {}, jars.A, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
				
			it "first check with appname", ( done )->
				req "testA", {}, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
				
			it "first check with noop", ( done )->
				req apps.A, { noop: 1 }, jars.A, ( body )->
					body.should.equal "EMPTY"
					done()
					return
				return
				
			it "upgrade with id", ( done )->
				req apps.A, { upgrade: uids.A }, jars.A, ( body )->
					body.should.equal "LOGGED IN - USER: #{uids.A}"
					done()
					return
				return
		
			it "check session of first user", ( done )->
				req apps.A, null, jars.A, ( body )->
					body.should.equal "USER: #{uids.A}"
					done()
					return
				return

			it "destroy session of first user", ( done )->
				req apps.A, { destroy: 1 }, jars.A, ( body )->
					body.should.equal "killed + 1"
					done()
					return
				return
			
			it "recheck session of first user after destroy", ( done )->
				req apps.A, null, jars.A, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
				
			it "upgrade with user B", ( done )->
				req apps.A, { upgrade: uids.B }, jars.B, ( body )->
					body.should.equal "LOGGED IN - USER: #{uids.B}"
					done()
					return
				return
			
			it "upgrade with user C", ( done )->
				req apps.A, { upgrade: uids.C }, jars.C, ( body )->
					body.should.equal "LOGGED IN - USER: #{uids.C}"
					done()
					return
				return
			
			it "check session of user B", ( done )->
				req apps.A, null, jars.B, ( body )->
					body.should.equal "USER: #{uids.B}"
					done()
					return
				return
			
			it "check session of user B in another app", ( done )->
				req apps.B, null, jars.B, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
			
			it "check activity from user B (number of sessions in app)", ( done )->
				req apps.A, { activity: 1 }, jars.B, ( body )->
					body.should.equal "USER: #{uids.B}\n{\"activity\":2}"
					done()
					return
				return
			
			it "check activity from user B", ( done )->
				req apps.A, { soapp: 1 }, jars.B, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.B}"
					data = JSON.parse( data )
					data.sessions.should.length( 2 )
					for session in data.sessions
						[ uids.B, uids.C ].should.containEql( session.id )
					done()
					return
				return
				
			it "check activity from user C", ( done )->
				req apps.A, { soapp: 1 }, jars.C, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.C}"
					data = JSON.parse( data )
					data.sessions.should.length( 2 )
					for session in data.sessions
						[ uids.B, uids.C ].should.containEql( session.id )
					done()
					return
				return
				
			it "check soid of user B", ( done )->
				req apps.A, { soid: 1 }, jars.B, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.B}"
					data = JSON.parse( data )
					data.sessions.should.length( 1 )
					for session in data.sessions
						uids.B.should.containEql( session.id )
					done()
					return
				return
			
			it "upgrade with user D", ( done )->
				req apps.A, { upgrade: uids.D }, jars.D, ( body )->
					body.should.equal "LOGGED IN - USER: #{uids.D}"
					done()
					return
				return
			
			it "check activity from user B", ( done )->
				req apps.A, { soapp: 1 }, jars.B, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.B}"
					data = JSON.parse( data )
					data.sessions.should.length( 3 )
					for session in data.sessions
						[ uids.B, uids.C, uids.D ].should.containEql( session.id )
					done()
					return
				return
			
			it "destroy session of user B", ( done )->
				req apps.A, { destroy: 1 }, jars.B, ( body )->
					body.should.equal "killed + 1"
					done()
					return
				return
			
			it "check activity from user C", ( done )->
				req apps.A, { soapp: 1 }, jars.C, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.C}"
					data = JSON.parse( data )
					data.sessions.should.length( 2 )
					for session in data.sessions
						[ uids.C, uids.D ].should.containEql( session.id )
						[ uids.B ].should.not.containEql( session.id )
					done()
					return
				return
			
			
			it "set data for user C", ( done )->
				req apps.A, { save: 1, xyz: 42, abc: 23 }, jars.C, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.C}"
					data[...7].should.equal( "SAVED: " )
					data = JSON.parse( data[7..] )
					data.should.eql( { xyz: "42", abc: "23" } )
					done()
					return
				return
			
			it "set data for user C, overwite one", ( done )->
				req apps.A, { save: 1, xyz: 666 }, jars.C, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.C}"
					data[...7].should.equal( "SAVED: " )
					data = JSON.parse( data[7..] )
					data.should.eql( { xyz: "666", abc: "23" } )
					#data.should.not.have.property( "abc" )
					done()
					return
				return
			
			it "set data for user C, clear one", ( done )->
				req apps.A, { save: 1, abc: null }, jars.C, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.C}"
					data[...7].should.equal( "SAVED: " )
					data = JSON.parse( data[7..] )
					data.should.eql( { xyz: "666", abc: null } )
					done()
					return
				return
			
			it "check activity from user C", ( done )->
				req apps.A, { soapp: 1 }, jars.C, ( body )->
					[ usr, data ] = body.split( "\n" )
					usr.should.equal "USER: #{uids.C}"
					data = JSON.parse( data )
					data.sessions.should.length( 2 )
					for session in data.sessions
						[ uids.C, uids.D ].should.containEql( session.id )
						[ uids.B ].should.not.containEql( session.id )
					done()
					return
				return
			
			it "destroy all sessions of user C", ( done )->
				req apps.A, { destroyall: 1 }, jars.C, ( body )->
					body.should.equal "USER: #{uids.C}\n1"
					done()
					return
				return
			
			it "check session of user C", ( done )->
				req apps.A, null, jars.C, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
			
			jars.D2 = request.jar()
			jars.D3 = request.jar()
			
			it "create second session for user D", ( done )->
				req apps.A, { upgrade: uids.D }, jars.D2, ( body )->
					body.should.equal "LOGGED IN - USER: #{uids.D}"
					done()
					return
				return
				
			it "create thrid session for user D", ( done )->
				req apps.A, { upgrade: uids.D }, jars.D3, ( body )->
					body.should.equal "LOGGED IN - USER: #{uids.D}"
					done()
					return
				return
			
			it "check session of user D in first jar", ( done )->
				req apps.A, null, jars.D, ( body )->
					body.should.equal "USER: #{uids.D}"
					done()
					return
				return
			
			it "check session of user D in second jar", ( done )->
				req apps.A, null, jars.D2, ( body )->
					body.should.equal "USER: #{uids.D}"
					done()
					return
				return
			
			it "check session of user D in third jar", ( done )->
				req apps.A, null, jars.D3, ( body )->
					body.should.equal "USER: #{uids.D}"
					done()
					return
				return
				
			it "destroy session of user D in third jar", ( done )->
				req apps.A, { destroy: 1 }, jars.D3, ( body )->
					body.should.equal "killed + 1"
					done()
					return
				return
				
			it "check session of user D in first jar", ( done )->
				req apps.A, null, jars.D, ( body )->
					body.should.equal "USER: #{uids.D}"
					done()
					return
				return
			
			it "check session of user D in second jar", ( done )->
				req apps.A, null, jars.D2, ( body )->
					body.should.equal "USER: #{uids.D}"
					done()
					return
				return
			
			it "check session of user D in third jar", ( done )->
				req apps.A, null, jars.D3, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
				
			it "destroy all other sessions of user D", ( done )->
				req apps.A, { destroyall: 1 }, jars.D2, ( body )->
					body.should.equal "USER: #{uids.D}\n2"
					done()
					return
				return
			
			it "check session of user D in first jar", ( done )->
				req apps.A, null, jars.D, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
			
			it "check session of user D in second jar", ( done )->
				req apps.A, null, jars.D2, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
			
			it "check session of user D in third jar", ( done )->
				req apps.A, null, jars.D3, ( body )->
					body.should.equal "UNKOWN"
					done()
					return
				return
			
			return
			
	return



	
