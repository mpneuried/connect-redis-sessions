connect-redis-sessions
======================

[![Build Status](https://david-dm.org/mpneuried/connect-redis-sessions.png)](https://david-dm.org/mpneuried/connect-redis-sessions)

[![infos](https://nodei.co/npm/connect-redis-sessions.png?downloads=true&stars=true)](https://nodei.co/npm/connect-redis-sessions/)

Is a connect or express middleware to simply use the [redis sessions](https://github.com/smrchy/redis-sessions).
With [redis sessions](https://github.com/smrchy/redis-sessions) you can handle multiple sessions per user_id.

## Example

```js
// get the modules
var express = require( "express" );
var cookieParser = require( "cookie-parser" );
var ConnectRedisSessions = require( "connect-redis-sessions" );
var app = express();


// configute express
app
	.use( express.query() )
	.use( cookieParser() )
	.use( ConnectRedisSessions( { app: "myappname" } ) )

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
	res.end( "Hello express redis sessions" );
});
```

## Installation

`npm install connect-redis-sessions`

## Usage

1. you have to get the express middleware init method by	
`var ConnectRedisSessions = require( "connect-redis-sessions" );`
2. init your express or express server	
`var app = require( "express" )();`
3. init the express cookie parser	
`app.use( express.cookieParser() );`
4. use express redis sessions as middleware	
`app.use( ConnectRedisSessions( { app: "myappname" } ) );`

<span style="color:red">**Attension:**</span>
If you're using Express < 4.x then please use version `0.x` otherwise use version `1.x` of `connect-redis-sessions`.
It schould work with connect and the older Express, but there could be eventual issues due to the new Express 4.x api behaviour i haven't found yet.

## Initialisation

**`ConnectRedisSessions( options )`**

To init the session handling just add the options object as argument.

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
Redis session timeout to wipe the session on idle time. Must be over `10`. If you set a value `< 10` the module will use `10` instead.


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

#### `req.session.upgrade( user_id [, ttl ][, cb] )`

upgrade a empty session to a real redis session by upgrading the session with the user_id.
 
**Arguments**

* `user_id` : *( `String|Number` required )*: The user id this session should belong to.
* `ttl` : *( `Number` optional; default = `options.ttl` )*: Optinal ttl for this session. If not set the ttl defined in options would be used. Must be over `10`. If you set a value `< 10` the module will use `10` instead.
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

#### `req.session.getRedisSessionsModule()`

Will return the internal instance of [RedisSessions](https://github.com/smrchy/redis-sessions).
You can use this to handle sessions of other users.
 
**Returns**

*( `RedisSessions` )*: The raw redis sessions module.

## Examples

### advanced init

```js
// get the modules
var express = require( "express" );
var cookieParser = require( "cookie-parser" );
var bodyParser = require( "body-parser" );
var logger = require( "morgan" );
var ConnectRedisSessions = require( "connect-redis-sessions" );
var app = express();

// get the appname by the first part of the url
var _getAppName = function(req, cb) {
	var appname;
	appname = req._parsedUrl.pathname.split("/")[1];
	if (appname != null) {
		cb(null, appname);
	} else {
		// if nothing is returned a empty session will be availible
		cb(null);
	}
};

fnCRS = ConnectRedisSessions( { app: _getAppName, ttl: _timeSecDay, cookie: { maxAge: _timeSecDay * 1000 } } );

// configute express
_timeSecDay = 60 * 60 * 24
app
	.use( logger( "dev" ) )
	.use( express.query() )
	.use( bodyParser() )
	.use( cookieParser() )
	.use( fnCRS )


// an example how to get the internal redis-sessions instance out of the connect-redis-sessions module
redisSessionsInstance = fnCRS.handler.rds;

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

### check for a logged in user

```js
// listen for requests
app.use( function( req, res ){
	if( req.session.id == void( 0 ) ){
		res.end( "user not logged in" );
	} else {
		res.end( "user " + req.session._meta.id + " is logged in" );
	}
});
```

### upgrade a session with a user_id

```js
// listen for requests
app.use( function( req, res ){
	var user_id = "myuser_id" // code to get your user_id 
	req.session.upgrade( user_id, req.query.sessionttl, function(){
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


## Release History
|Version|Date|Description|
|:--:|:--:|:--|
|v1.2.0|2014-11-28|Added ttl to upgrade method + Issues by [thynson](https://github.com/thynson)|
|v1.0.3|2014-09-11|Added return of `sessionhandler` object on initialisation|
|v1.0.2|2014-04-25|Small bugfix for cookie handling|
|v1.0.1|2014-03-17|Updated readme with external express/connect middleware|
|v1.0.0|2014-03-17|fixed cookie set for express 4.x |
|v0.2.0|2014-03-07|express 0.4.0 support |
|v0.1.5|2013-12-04|Added method `SessionObject.getRedisSessionsModule()` to receive the internal redis session instance |
|v0.1.4|2013-11-20|Fixed `No d supplied` error on upgrade|
|v0.1.3|2013-10-15|Fixed error on missing callback|
|v0.1.2|2013-10-15|Added example `check for a logged in user` to readme|
|v0.1.1|2013-10-15|Fixed module to be compatible with express and changed readme examples from connect to express|
|v0.1.0|2013-10-04|Initial commit|

## Related Projects
|Name|Description|
|:--|:--|
|[**redis-sessions**](https://github.com/smrchy/redis-sessions)|The redis session module this middleware module is based on|
|[**tcs_node_auth**](https://github.com/mpneuried/tcs_node_auth)|Authentication module to handle login and register with a integrated mail double-opt-in logic.|

## Other projects

|Name|Description|
|:--|:--|
|[**systemhealth**](https://github.com/mpneuried/systemhealth)|Node module to run simple custom checks for your machine or it's connections. It will use [redis-heartbeat](https://github.com/mpneuried/redis-heartbeat) to send the current state to redis.|
|[**node-cache**](https://github.com/tcs-de/nodecache)|Simple and fast NodeJS internal caching. Node internal in memory cache like memcached.|
|[**rsmq**](https://github.com/smrchy/rsmq)|A really simple message queue based on Redis|
|[**task-queue-worker**](https://github.com/smrchy/task-queue-worker)|A powerful tool for background processing of tasks that are run by making standard http requests.|
|[**soyer**](https://github.com/mpneuried/soyer)|Soyer is small lib for serverside use of Google Closure Templates with node.js.|
|[**grunt-soy-compile**](https://github.com/mpneuried/grunt-soy-compile)|Compile Goggle Closure Templates ( SOY ) templates inclding the handling of XLIFF language files.|
|[**backlunr**](https://github.com/mpneuried/backlunr)|A solution to bring Backbone Collections together with the browser fulltext search engine Lunr.js|

[![downloads](https://nodei.co/npm-dl/connect-redis-sessions.png?months=6)](https://nodei.co/npm/connect-redis-sessions/)


## The MIT License (MIT)

Copyright © 2013 Mathias Peter, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
