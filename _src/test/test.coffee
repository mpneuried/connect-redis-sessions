# get dependecies
assert = require( "assert" )
connect = require( "connect" )

ConnectRedisSessions = require( "./" )(connect)

store = new ConnectRedisSessions( app: "test" )

process.once "uncaughtException", ( err )->
	console.error err
	return


store.set "123", { cookie: { maxAge: 2000 },  }
