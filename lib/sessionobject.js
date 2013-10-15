(function() {
  var Session, crc32,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  crc32 = require('buffer-crc32');

  module.exports = Session = (function() {
    function Session(handler, req, data) {
      this.soid = __bind(this.soid, this);
      this.soapp = __bind(this.soapp, this);
      this.activity = __bind(this.activity, this);
      this.destroyall = __bind(this.destroyall, this);
      this.hash = __bind(this.hash, this);
      this.destroy = __bind(this.destroy, this);
      this.reload = __bind(this.reload, this);
      this.save = __bind(this.save, this);
      this.attributes = __bind(this.attributes, this);
      this.upgrade = __bind(this.upgrade, this);
      var _k, _v;
      Object.defineProperty(this, "req", {
        value: req
      });
      Object.defineProperty(this, "handler", {
        value: handler
      });
      Object.defineProperty(this, "id", {
        value: req.sessionID
      });
      Object.defineProperty(this, "d", {
        get: this.attributes
      });
      if ('object' === typeof data) {
        for (_k in data) {
          _v = data[_k];
          this[_k] = _v;
        }
      }
      return;
    }

    Session.prototype.upgrade = function(id, cb) {
      var _this = this;
      if (this.id != null) {
        cb();
        return;
      }
      this.handler.create(this.req, id, function(err, token) {
        if (err) {
          return cb(err);
        }
        if (_this.handler.debug) {
          console.log("NEW TOKEN", token);
        }
        _this.handler.generate(_this.req, token, id);
        cb();
      });
      return this;
    };

    Session.prototype.attributes = function() {
      var _k, _ref, _ret, _v;
      _ret = {};
      for (_k in this) {
        _v = this[_k];
        if (_k !== "_meta" && (_v === null || ((_ref = typeof _v) === "string" || _ref === "number" || _ref === "boolean"))) {
          _ret[_k] = _v;
        }
      }
      return _ret;
    };

    Session.prototype.save = function(cb) {
      if (cb == null) {
        cb = function() {};
      }
      if (!this.id) {
        this.handler._error("no-token", cb);
        return this;
      }
      this.handler.set(this.req, cb);
      return this;
    };

    Session.prototype.reload = function(cb) {
      var _this = this;
      if (cb == null) {
        cb = function() {};
      }
      if (!this.id) {
        this.handler._error("no-token", cb);
        return this;
      }
      this.handler.get(this.id, function(err, sess) {
        if (err) {
          return cb(err);
        }
        if (sess == null) {
          _this.handler._error("session-load");
        }
        _this.handler.createSession(req, sess);
        cb();
      });
      return this;
    };

    Session.prototype.destroy = function(cb) {
      var _this = this;
      if (this.id == null) {
        this.handler._error("no-token", cb);
        return this;
      }
      this.id = null;
      this.handler.destroy(this.req, function(err, data) {
        _this.req.res.on("header", _this.handler._remCookie(_this.req));
        cb(err, data);
      });
      return this;
    };

    Session.prototype.hash = function() {
      return crc32.signed(JSON.stringify(this.attributes()));
    };

    Session.prototype.destroyall = function(cb) {
      var _this = this;
      if (this.id == null) {
        this.handler._error("no-token", cb);
        return this;
      }
      this.id = null;
      this.handler.killIdSessions(this.req, function(err, data) {
        _this.req.res.on("header", _this.handler._remCookie(_this.req));
        cb(err, data);
      });
      return this;
    };

    Session.prototype.activity = function() {
      var args, cb, _i;
      if (!this.id) {
        this.handler._error("no-token", cb);
        return this;
      }
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      this.handler.getAppActivity(this.req, args[0], cb);
    };

    Session.prototype.soapp = function() {
      var args, cb, _i;
      if (!this.id) {
        this.handler._error("no-token", cb);
        return this;
      }
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      this.handler.getAppSessions(this.req, args[0], cb);
    };

    Session.prototype.soid = function(cb) {
      if (!this.id) {
        this.handler._error("no-token", cb);
        return this;
      }
      this.handler.getIdSessions(this.req, cb);
    };

    return Session;

  })();

  crc32 = require('buffer-crc32');

}).call(this);
