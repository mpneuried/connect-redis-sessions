(function() {
  var RedisSessions, SessionHandler, SessionObject, expressSession,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  RedisSessions = require("redis-sessions");

  expressSession = require("express-session");

  SessionObject = require("./sessionobject");

  module.exports = SessionHandler = (function() {
    function SessionHandler(options) {
      var _apptype, ref;
      if (options == null) {
        options = {};
      }
      this.getAppActivity = bind(this.getAppActivity, this);
      this.getIdSessions = bind(this.getIdSessions, this);
      this.getAppSessions = bind(this.getAppSessions, this);
      this.killIdSessions = bind(this.killIdSessions, this);
      this.destroy = bind(this.destroy, this);
      this._redisToSession = bind(this._redisToSession, this);
      this.set = bind(this.set, this);
      this.get = bind(this.get, this);
      this.create = bind(this.create, this);
      this._remCookie = bind(this._remCookie, this);
      this._setCookie = bind(this._setCookie, this);
      this.createSession = bind(this.createSession, this);
      this.generate = bind(this.generate, this);
      this._error = bind(this._error, this);
      if ((options.app != null) && ((ref = (_apptype = typeof options.app)) === "string" || ref === "function")) {
        if (_apptype === "function") {
          this.getApp = options.app;
        } else {
          this.getApp = this._defaultGetApp(options.app);
        }
      } else {
        this._error("no-app-defined");
        return;
      }
      this.app = options.app;
      this.rds = new RedisSessions(options);
      this.redis = this.rds.redis;
      if (options.debug) {
        this.debug = true;
      } else {
        this.debug = false;
      }
      this.ready = false;
      this.redis.on("connect", (function(_this) {
        return function() {
          return _this.ready = true;
        };
      })(this));
      this.redis.on("disconnect", (function(_this) {
        return function() {
          return _this.ready = false;
        };
      })(this));
      this.trustProxy = options.proxy;
      this.cookie = options.cookie || {};
      if (options.ttl < 10) {
        console.warn("Tried to use `ttl < 10`! So Reset ttl to `10`.");
        this.ttl = 10;
      } else {
        this.ttl = options.ttl;
      }
      return;
    }

    SessionHandler.prototype._defaultGetApp = function(app) {
      return function(req, cb) {
        return cb(null, app);
      };
    };

    SessionHandler.prototype._error = function(key, cb) {
      var _err, ref;
      if (typeof key === "string") {
        _err = new Error();
        _err.name = key;
        if (this.ERRORS[key] != null) {
          _err.message = this.ERRORS[key];
        }
      } else {
        _err = key;
      }
      if ((cb != null ? (ref = cb.constructor) != null ? ref.name : void 0 : void 0) === "ServerResponse") {
        cb.statusCode = 500;
        cb.end(_err.toString());
        console.error("cannot get appname", _err, _err.stack);
      } else if ((cb != null) && typeof cb === "function") {
        cb(_err);
      } else {
        throw _err;
      }
    };

    SessionHandler.prototype.generate = function(req, token, id, ttl) {
      var _writeHead, res;
      req.sessionID = token;
      req.session = new SessionObject(this, req, this._redisToSession({
        id: id,
        ttl: ttl,
        ip: this._getRequestIP(req)
      }));
      res = req.res;
      _writeHead = res.writeHead;
      res.writeHead = (function(_this) {
        return function() {
          _this._setCookie(req);
          _writeHead.apply(res, arguments);
        };
      })(this);
    };

    SessionHandler.prototype.createSession = function(req, sess) {
      req.session = new SessionObject(this, req, sess);
      return req.session;
    };

    SessionHandler.prototype._setCookie = function(req) {
      var cookie, isNew, proto, ref, ref1, ref2, ref3, tls, val;
      if (!req.session) {
        return;
      }
      cookie = new expressSession.Cookie(this.cookie);
      if (req.secure != null) {
        tls = req.secure;
      } else {
        proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].toLowerCase().trim();
        tls = req.connection.encrypted || (this.trustProxy && 'https' === proto);
      }
      isNew = ((ref = req.session) != null ? ref.id : void 0) !== ((ref1 = req.cookies) != null ? ref1[req._appname] : void 0);
      if (cookie.secure && !tls) {
        if (this.debug) {
          console.warn("not secured");
        }
        return;
      }
      if (cookie.hasLongExpires) {
        if (this.debug) {
          console.log("allready set cookie");
        }
        return;
      }
      if (cookie._expires == null) {
        if (this.debug) {
          console.log("existing non expiring cookie", (ref2 = req.cookies) != null ? ref2[req._appname] : void 0, (ref3 = req.session) != null ? ref3.id : void 0, isNew);
        }
        if (!isNew) {
          if (this.debug) {
            console.log("already set browser-session cookie");
          }
          return;
        }
      } else if (req._originalHash === req.session.hash() && req._originalId === req.session.id) {
        if (this.debug) {
          console.log("unmodified session");
        }
        return;
      }
      val = cookie.serialize(req._appname, req.sessionID);
      req.res.setHeader('Set-Cookie', val);
    };

    SessionHandler.prototype._remCookie = function(req) {
      var cookie, val;
      if (!req.session) {
        return;
      }
      cookie = new expressSession.Cookie(this.cookie);
      cookie.expires = new Date(0);
      val = cookie.serialize(req._appname, req.sessionID);
      req.res.setHeader('Set-Cookie', val);
    };

    SessionHandler.prototype._getRequestIP = function(req) {
      var ref;
      if (req.ip) {
        return req.ip;
      } else if (((ref = req.headers) != null ? ref['X-Forwarded-For'] : void 0) != null) {
        return req.headers['X-Forwarded-For'];
      } else {
        return req.connection.remoteAddress;
      }
    };

    SessionHandler.prototype.create = function(req, id, ttl, cb) {
      if (ttl == null) {
        ttl = this.ttl;
      }
      if (this.debug) {
        console.log("CREATE", id, ttl);
      }
      this.rds.create({
        app: req._appname,
        ttl: ttl,
        id: id,
        ip: this._getRequestIP(req)
      }, function(err, data) {
        if (err) {
          return cb(err);
        }
        cb(null, data.token);
      });
    };

    SessionHandler.prototype.get = function(req, cb) {
      this.rds.get({
        app: req._appname,
        token: req.sessionID
      }, (function(_this) {
        return function(err, data) {
          if (err) {
            return cb(err);
          }
          if (_this.debug) {
            console.log("GOT", data);
          }
          if ((data != null) && Object.keys(data).length !== 0) {
            if (cb) {
              cb(null, _this._redisToSession(data));
            }
            return;
          }
          if (cb) {
            cb(null, null);
          }
        };
      })(this));
    };

    SessionHandler.prototype.set = function(req, cb) {
      var _args, _attrs;
      _args = {
        app: req._appname,
        token: req.sessionID
      };
      _attrs = req.session.attributes();
      if (Object.keys(_attrs).length !== 0) {
        _args.d = req.session.attributes();
      } else {
        _args.d = {};
      }
      this.rds.set(_args, (function(_this) {
        return function(err, data) {
          if (err) {
            return cb(err);
          }
          if ((data != null) && Object.keys(data).length !== 0) {
            if (cb) {
              cb(null, _this._redisToSession(data));
            }
          } else {
            if (cb) {
              cb(null, null);
            }
          }
        };
      })(this));
    };

    SessionHandler.prototype._redisToSession = function(data) {
      var _k, _sess, _v, ref;
      _sess = {};
      ref = data.d || {};
      for (_k in ref) {
        _v = ref[_k];
        _sess[_k] = _v;
      }
      _sess._meta = {
        id: data.id || null,
        r: data.r || 1,
        w: data.w || 1,
        ttl: data.ttl || this.ttl || 7200,
        idle: data.idle || 0,
        ip: data.ip || ""
      };
      return _sess;
    };

    SessionHandler.prototype.destroy = function(req, cb) {
      this.rds.kill({
        app: req._appname,
        token: req.sessionID
      }, function(err, data) {
        if (err) {
          return cb(err);
        }
        if (cb) {
          cb(null, data.kill || 0);
        }
      });
    };

    SessionHandler.prototype.killIdSessions = function(req, cb) {
      this.rds.killsoid({
        app: req._appname,
        id: req.session._meta.id
      }, function(err, data) {
        if (err) {
          return cb(err);
        }
        if (cb) {
          cb(null, data.kill || 0);
        }
      });
    };

    SessionHandler.prototype.getAppSessions = function(req, dt, cb) {
      if (dt == null) {
        dt = 600;
      }
      this.rds.soapp({
        app: req._appname,
        dt: dt
      }, cb);
    };

    SessionHandler.prototype.getIdSessions = function(req, cb) {
      this.rds.soid({
        app: req._appname,
        id: req.session._meta.id
      }, cb);
    };

    SessionHandler.prototype.getAppActivity = function(req, dt, cb) {
      if (dt == null) {
        dt = 600;
      }
      this.rds.activity({
        app: req._appname,
        dt: dt
      }, cb);
    };

    SessionHandler.prototype.ERRORS = {
      "no-token": "This is an invalid or outdated session",
      "no-app-defined": "To initialize a ConnectRedisSessions object you have to define the option `app` as a string or function",
      "cookies-disabled": "The cookieParser has not been initialized. Please add `connect.cookieParser()` to your connect/express configuration."
    };

    return SessionHandler;

  })();

}).call(this);
