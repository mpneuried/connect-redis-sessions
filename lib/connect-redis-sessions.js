(function() {
  var RedisSessions, crc32, signature, uid,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  RedisSessions = require("redis-sessions");

  signature = require('cookie-signature');

  uid = require('uid2');

  crc32 = require('buffer-crc32');

  signature = require('cookie-signature');

  module.exports = function(connect) {
    var ConnectRedisSessions, Cookie, Session, utils;
    Cookie = connect.session.Cookie;
    Session = connect.session.Session;
    utils = connect.utils;
    Session = (function() {
      function Session(store, req, data) {
        this.store = store;
        this.regenerate = __bind(this.regenerate, this);
        this.destroy = __bind(this.destroy, this);
        this.reload = __bind(this.reload, this);
        this.save = __bind(this.save, this);
        this.resetMaxAge = __bind(this.resetMaxAge, this);
        this.touch = __bind(this.touch, this);
        Object.defineProperty(this, "req", {
          value: req
        });
        Object.defineProperty(this, "id", {
          value: req.sessionID
        });
        if ('object' === typeof data) {
          utils.merge(this, data);
        }
        return;
      }

      Session.prototype.touch = function() {
        return this.resetMaxAge();
      };

      Session.prototype.resetMaxAge = function() {
        this.cookie.maxAge = this.cookie.originalMaxAge;
        return this;
      };

      Session.prototype.save = function(cb) {
        if (cb == null) {
          cb = function() {};
        }
        this.store.set(this.id, this, cb);
        return this;
      };

      Session.prototype.reload = function(cb) {
        var _this = this;
        if (cb == null) {
          cb = function() {};
        }
        this.store.get(this.id, function(err, sess) {
          if (err) {
            return cb(err);
          }
          if (sess == null) {
            _this.store._error("session-load");
          }
          _this.store.createSession(req, sess);
          cb();
        });
        return this;
      };

      Session.prototype.destroy = function(cb) {
        delete this.req.session;
        this.store.destroy(this.id, cb);
        return this;
      };

      Session.prototype.regenerate = function(cb) {
        this.store.regenerate(this.req, fn);
        return this;
      };

      return Session;

    })();
    return ConnectRedisSessions = (function() {
      function ConnectRedisSessions(options) {
        var _this = this;
        if (options == null) {
          options = {};
        }
        this._error = __bind(this._error, this);
        this.clear = __bind(this.clear, this);
        this.length = __bind(this.length, this);
        this.destroy = __bind(this.destroy, this);
        this.set = __bind(this.set, this);
        this.setID = __bind(this.setID, this);
        this.get = __bind(this.get, this);
        this.getKey = __bind(this.getKey, this);
        this.regenerate = __bind(this.regenerate, this);
        this.createSession = __bind(this.createSession, this);
        this.generate = __bind(this.generate, this);
        this.hash = __bind(this.hash, this);
        this.middleware = __bind(this.middleware, this);
        /*
        			if not options.app? and typeof options.app isnt "string"
        				@_error( "no-app-defined" )
        				return
        			@app = options.app
        */

        this.rds = new RedisSessions(options);
        this.redis = this.rds.redis;
        if (options.debug) {
          this.debug = true;
        } else {
          this.debug = false;
        }
        this.ready = false;
        this.redis.on("connect", function() {
          return _this.ready = true;
        });
        this.redis.on("disconnect", function() {
          return _this.ready = false;
        });
        this.trustProxy = options.proxy;
        this.cookie = options.cookie || {};
        this.key = options.key || "redissessions.sid";
        this.secret = options.secret;
        return;
      }

      ConnectRedisSessions.prototype.middleware = function(req, res, next) {
        var end, originalHash, originalId, pause, rawCookie, secret, unsignedCookie,
          _this = this;
        if (req.session) {
          return next();
        }
        if (!this.ready) {
          if (this.debug) {
            console.warn("Connection not ready");
          }
          next();
          return;
        }
        if (req.originalUrl.indexOf(this.cookie.path || "/")) {
          return next();
        }
        secret = this.secret || req.secret;
        if (!secret) {
          this._error("no-secret");
        }
        rawCookie = req.cookies[this.key];
        unsignedCookie = req.signedCookies[this.key];
        if (!unsignedCookie && rawCookie) {
          unsignedCookie = utils.parseSignedCookie(rawCookie, this.secret);
        }
        originalHash = null;
        originalId = null;
        res.on("header", function() {
          var cookie, isNew, proto, tls, val, _signed;
          if (!req.session) {
            return;
          }
          cookie = req.session.cookie;
          proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].toLowerCase().trim();
          tls = req.connection.encrypted || (_this.trustProxy && 'https' === proto);
          isNew = unsignedCookie !== req.sessionID;
          if (cookie.secure && !tls) {
            if (_this.debug) {
              console.warn("not secured");
            }
            return;
          }
          if (!isNew && cookie.hasLongExpires) {
            if (_this.debug) {
              console.log("allready set cookie");
            }
            return;
          }
          if (cookie.expires == null) {
            if (!isNew) {
              if (_this.debug) {
                console.log("already set browser-session cooki");
              }
              return;
            }
          } else if (originalHash === _this.hash(req.session) && originalId === req.session.id) {
            if (_this.debug) {
              console.log("unmodified session");
            }
            return;
          }
          _signed = signature.sign(req.sessionID, _this.secret);
          val = cookie.serialize(_this.key, _signed);
          res.setHeader('Set-Cookie', val);
        });
        end = res.end;
        res.end = function(data, encoding) {
          res.end = end;
          if (!req.session) {
            return res.end(data, encoding);
          }
          req.session.resetMaxAge();
          req.session.save(function(err) {
            if (err) {
              console.error(err.stack);
            }
            res.end(data, encoding);
          });
        };
        req.sessionID = unsignedCookie;
        if (!req.sessionID) {
          if (this.debug) {
            console.log("no SID sent, generating session");
          }
          this.generate(req);
          next();
          return;
        }
        pause = utils.pause(req);
        if (req.sessionID[0] === "u:") {
          originalId = req.sessionID;
          req.session;
          originalHash = this.hash(req.session || {});
          next();
        } else {
          next();
        }
      };

      ConnectRedisSessions.prototype.hash = function(sess) {
        var _strg;
        _strg = JSON.stringify(sess, function(key, val) {
          if (key !== "cookie") {
            return val;
          }
        });
        console.log("hash", _strg, sess);
        return crc32.signed(_strg);
      };

      ConnectRedisSessions.prototype.generate = function(req, hasID) {
        var _uid;
        if (hasID == null) {
          hasID = false;
        }
        _uid = uid(24);
        req.sessionID = (hasID ? "k:" : "u:") + _uid;
        req.session = new Session(this, req);
        req.session.cookie = new Cookie(this.cookie);
        console.log("GENERATED");
      };

      ConnectRedisSessions.prototype.createSession = function(req, sess) {
        var _exp, _oma;
        _exp = sess.cookie.expires;
        _oma = sess.cookie.originalMaxAge;
        sess.cookie = new Cookie(this.cookie);
        if ("string" === typeof _exp) {
          sess.cookie.expires = new Date(_exp);
        }
        sess.originalMaxAge = _oma;
        req.session = new Session(this, req, sess);
        return req.session;
      };

      ConnectRedisSessions.prototype.regenerate = function(req, cb) {
        var _this = this;
        this.destory(req.sessionID, function(err) {
          _this.generate(req);
          cb(err);
        });
      };

      ConnectRedisSessions.prototype.getKey = function(sid) {
        this.prefix + sid;
      };

      ConnectRedisSessions.prototype.get = function(sid, cb) {
        var _this = this;
        console.log("GET", arguments);
        this.rdSession.get({
          app: this.app,
          token: sid
        }, function(err, data) {
          if (err) {
            return cb(err);
          }
          console.log("GOT", data);
          if (data.d) {
            if (cb) {
              cb(null, JSON.parse(data.d));
            }
          } else {
            if (cb) {
              cb(null);
            }
          }
        });
      };

      ConnectRedisSessions.prototype.setID = function(sid, cb) {
        var _this = this;
        this.rdSession.create({
          app: this.app,
          ttl: 60 * 60,
          id: id
        }, function(err, data) {
          if (err) {
            return cb(err);
          }
          if (cb) {
            cb();
          }
        });
      };

      ConnectRedisSessions.prototype.set = function(sid, sess, cb) {
        cb();
      };

      ConnectRedisSessions.prototype.destroy = function(sid, cb) {
        console.log("DESTORY", arguments);
      };

      ConnectRedisSessions.prototype.length = function(cb) {
        console.log("LENGTH", arguments);
      };

      ConnectRedisSessions.prototype.clear = function(cb) {
        console.log("CLEAR", arguments);
      };

      ConnectRedisSessions.prototype._error = function(key, cb) {
        var _err;
        _err = new Error();
        _err.name = key;
        if (this.ERRORS[key] != null) {
          _err.message = this.ERRORS[key];
        }
        if ((cb != null) && typeof cb === "function") {
          cb(_err);
        } else {
          throw _err;
        }
      };

      ConnectRedisSessions.prototype.ERRORS = {
        "no-secret": "There is no secret define within the options",
        "no-app-defined": "To initialize a ConnectRedisSessions object you have to define the option `app` as a string"
      };

      return ConnectRedisSessions;

    })();
  };

}).call(this);
