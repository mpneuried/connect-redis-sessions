connect-redis-sessions
======================

Is a connect or express middleware to simply use the [redis sessions](https://github.com/smrchy/redis-sessions).
With [redis sessions](https://github.com/smrchy/redis-sessions) you can handle multiple sessions per user_id.

## Example

```js
// get the modules
var connect = require( "connect" );
var ConnectRedisSessions = require( "connect-redis-sessions" );
var app = connect();


// configute connect
app
	.use( connect.query() )
	.use( connect.cookieParser() )
	.use( ConnectRedisSessions( connect, { app: "myappname" } ) )

// listen for requests
app.use( function( req, res ){
	if( req.query.login ){
		// upgrade a session to a redis session by a user id
		req.session.upgrade( req.query.user_id );
	}
	if( req.sessin.id && req.query.logout ){
		// kill the active session
		req.session.destroy();
	}
	res.end( "Hello connect redis sessions" );
});
```

## Installation

`npm install connect-redis-sessions`

## Usage

1. you have to get the connect middleware init method by	
`var ConnectRedisSessions = require( "connect-redis-sessions" );`
2. init your connect or express server	
`var app = require( "connect" )();`
3. init the connect cookie parser	
`app.use( connect.cookieParser() );`
4. use connect redis sessions as middleware	
`app.use( ConnectRedisSessions( connect, { app: "myappname" } ) );`

## Initialisation

**`ConnectRedisSessions( connect, options )`**

To init the session handling just add the two arguments `connect` *( wich is the raw object out of `require( "connect" )` )* and an options object.

### Options

- **app** : *( `String|Function` required )*	
A simple string as appname or a function to calc the name on every request.	
The function addes to arguments `req` and `callback`.
```js
_getAppName = function( req, callback ){ callback( null, "staticname" ) };
```
- **cookie** : *( `Object` )*	
Cookie configuration. If nothing is set a browser session cookie will be used.
	- **maxAge** *( `Number` )*	
	The maximum age of the generated cookie.
	- **path** *( `String`, default = `/` )*	
	The cookie path
	- **httpOnly** *( `String`, default = true )*	
- **trustProxy** : *( `Boolean`, default = `false` )*
Only accept https cookies
- **port** : *( `Number`, default = `6379` )*
Redis port
- **host** : *( `String`, default = `127.0.0.1` )*
Redis host
- **namespace** : *( `String`, default = `rs` )*
The namespace prefix for all Redis keys used by the redis session module.
- **wipe** : *( `Number`, default = `600` )*
The interval in second after which the timed out redis sessions are wiped. No value less than 10 allowed.
- **ttl** : *( `Number`, default = `7200` )*
Redis session timeout to wipe the session on idle time


## Session Object

After you have initializes the session handling every connect/express request object will contain a key called `session`.
Within this Object you cann save rudimental keys of types `String`, `Number` and `Boolean`.
These keys will be saved at the end of the request and will be availible within the next request.

**And there are some additional methods and metadata**

### Properties

- **req.session.id** : *( `String` )*
Your session token
- **req.session.d** : *( `Object` )*
Just a small helper to get all data woithin the session without handling the properties and method names. All keys under `req.session.d[ ? ]` will also be availible under `req.session[ ? ]`
- **req.session._meta** : *( `Object` )*	
Contains the redis sessions meta data.
	- **id** : ( `String|Number` )	
	the global user id
	- **r** : ( `Number` )
	the session read count
	- **w** : ( `Number` )
	the session write count
	- **idle** : ( `Number` )
	the session idle time
	- **ttl** : ( `Number` )
	the session ttl

### Methods

#### `req.session.upgrade( user_id [, cb] )`

upgrade a empty session to a real redis session by upgrading the session with the user_id.
 
**Arguments**

* `user_id` : *( `String|Number` required )*: The user id this session shpuld belong to.
* `cb` : *( `Function` optional )*: Callback method with the results.

#### `req.session.soid( [ dt,] cb )`

Get all session of the logged in id.
 
**Arguments**

* `cb` : *( `Function` )*: Callback method with the results.

#### `req.session.soapp( [ dt,] cb )`

Get all session of an app.
 
**Arguments**

* `dt` : *( `Function` default = `600` )*: Get the app session history back in seconds.
* `cb` : *( `Function` )*: Callback method with the results.

#### `req.session.activity( [ dt,] cb )`

Query the amount of active session within the last 10 minutes (600 seconds).
 
**Arguments**

* `dt` : *( `Function` default = `600` )*: Get the app activity history back in seconds.
* `cb` : *( `Function` )*: Callback method with the results.

#### `req.session.destroy( [ cb ] )`

Kill the current active session
 
**Arguments**

* `cb` : *( `Function` optional )*: Callback method.

#### `req.session.destroyall( [ cb ] )`

Kill ALL session of the given user_id.
 
**Arguments**

* `cb` : *( `Function` optional )*: Callback method.

#### `req.session.save( [ cb ] )`

Changed session data will allways be saved at the end of a request.
But with this method you can force the saving of the session object to redis-sessions.
 
**Arguments**

* `cb` : *( `Function` optional )*: Callback method.

#### `req.session.reload( [ cb ] )`

Reload the session from redis sessions
 
**Arguments**

* `cb` : *( `Function` optional )*: Callback method.


## Examples

# advanced init

```js
// get the modules
var connect = require( "connect" );
var ConnectRedisSessions = require( "connect-redis-sessions" );
var app = connect();

// get the appname by the first part of the url
_getAppName = function(req, cb) {
	var appname;
	appname = req._parsedUrl.pathname.split("/")[1];
	if (appname != null) {
		cb(null, appname);
	} else {
		// if nothing is returned a empty session will be availible
		cb(null);
	}
};

// configute connect
_timeSecDay = 60 * 60 * 24
app
	.use( connect.query() )
	.use( connect.cookieParser() )
	.use( ConnectRedisSessions( connect, { app: "myappname", ttl: _timeSecDay, cookie: { maxAge: _timeSecDay * 1000 } } ) )

// listen for requests
app.use( function( req, res ){
	console.log( req.session );/*
		{
			"id": null,
			"d": {}
		}
	*/
	res.end( "no knwon user" );
});
```

## upgrade a session with a user_id

```js
// listen for requests
app.use( function( req, res ){
	var user_id = "myuser_id" // code to get your user_id 
	req.session.upgrade( user_id, function(){
		console.log( req.session );/*
			{
				"id": "myuser_id",
				"d": {},
				"_meta": {
					"id": "myuser_id",
					"r": 1,
					"w": 1,
					"ttl": 86400,
					"idle": 0
				}
			}
		*/
		res.end( "user " + user_id + " has logged in" );
	}); 
});
```

### write data to the session

```js
// listen for requests
app.use( function( req, res ){
	req.session.meaning = 42;
	req.session.foo = "bar";
	console.log( req.session );/*
		{
			"id": "myuser_id",
			"meaning": 42,
			"foo": "bar",
			"d": {
				"meaning": 42,
				"foo": "bar"
			},
			"_meta": {
				"id": "myuser_id",
				"r": 2,
				"w": 1,
				"ttl": 86400,
				"idle": 10
			}
		}
	*/
	res.end( "data written to session" );

});
```

### read data out of a session

```js
// listen for requests
app.use( function( req, res ){
	res.end( "session data " + req.session.foo + " says " + req.session.meaning );

});
```

### get all active user sessions

```js
// listen for requests
app.use( function( req, res ){
	req.session.soid( function( err, sessions ){
		if( err ){
			res.end( "ERROR" );
			return
		}
		res.end( JSON.stringify( sessions ) );/*
			[{
				id: 'myuser_id',
				r: 3,
				w: 2,
				ttl: 86400,
				idle: 10
			},
			{
				id: 'myuser_id',
				r: 1,
				w: 1,
				ttl: 7200,
				idle: 56040
			}] 
		*/
	});
});
```

### kill a session

```js
// listen for requests
app.use( function( req, res ){
	req.session.destroy()
});
```


## The MIT License (MIT)

Copyright © 2013 Patrick Liess, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
