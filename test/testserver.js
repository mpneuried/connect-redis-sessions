(function() {
  var ConnectRedisSessions, app, connect, _getAppName;

  connect = require("connect");

  ConnectRedisSessions = require("../");

  app = connect();

  _getAppName = (function(_this) {
    return function(req, cb) {
      var appname;
      appname = req._parsedUrl.pathname.split("/")[1];
      if (appname != null) {
        cb(null, appname);
      } else {
        cb(null);
      }
    };
  })(this);

  app.use(connect.logger("dev")).use(connect.query()).use(connect.cookieParser()).use(connect.bodyParser()).use(ConnectRedisSessions({
    app: _getAppName,
    debug: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  }));

  app.use(function(req, res) {
    var _k, _ref, _ref1, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _v;
    if (req.query.noop != null) {
      res.end("EMPTY");
      return;
    }
    if (req.query.upgrade != null) {
      req.session.upgrade(req.query.upgrade, (function(_this) {
        return function(err) {
          var _ref, _ref1;
          if (err) {
            res.end("ERROR: ", err);
            return;
          }
          console.log("SESSION", req.session);
          res.end("LOGGED IN - USER: " + ((_ref = req.session) != null ? (_ref1 = _ref._meta) != null ? _ref1.id : void 0 : void 0));
        };
      })(this));
    } else if ((((_ref = req.session) != null ? _ref.id : void 0) != null) && (req.query.destroy != null)) {
      req.session.destroy((function(_this) {
        return function(err, ok) {
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end("killed + " + ok);
        };
      })(this));
    } else if ((((_ref1 = req.session) != null ? _ref1.id : void 0) != null) && (req.query.save != null)) {
      _ref2 = req.query;
      for (_k in _ref2) {
        _v = _ref2[_k];
        if (_k !== "save") {
          req.session[_k] = (_v != null ? _v.length : void 0) ? _v : null;
        }
      }
      res.end(("USER: " + ((_ref3 = req.session) != null ? (_ref4 = _ref3._meta) != null ? _ref4.id : void 0 : void 0) + "\n") + ("SAVED: " + (JSON.stringify(req.session.attributes()))));
      return;
    } else if ((((_ref5 = req.session) != null ? _ref5.id : void 0) != null) && (req.query.soapp != null)) {
      req.session.soapp((function(_this) {
        return function(err, data) {
          var _ref6, _ref7;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((_ref6 = req.session) != null ? (_ref7 = _ref6._meta) != null ? _ref7.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else if ((((_ref6 = req.session) != null ? _ref6.id : void 0) != null) && (req.query.soid != null)) {
      req.session.soid((function(_this) {
        return function(err, data) {
          var _ref7, _ref8;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((_ref7 = req.session) != null ? (_ref8 = _ref7._meta) != null ? _ref8.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else if ((((_ref7 = req.session) != null ? _ref7.id : void 0) != null) && (req.query.activity != null)) {
      req.session.activity((function(_this) {
        return function(err, data) {
          var _ref8, _ref9;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((_ref8 = req.session) != null ? (_ref9 = _ref8._meta) != null ? _ref9.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else if ((((_ref8 = req.session) != null ? _ref8.id : void 0) != null) && (req.query.destroyall != null)) {
      req.session.destroyall((function(_this) {
        return function(err, data) {
          var _ref10, _ref9;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((_ref9 = req.session) != null ? (_ref10 = _ref9._meta) != null ? _ref10.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else {
      if (req.session.id) {
        console.log("SESSION", req.session.d.r);
        res.end("USER: " + ((_ref9 = req.session) != null ? (_ref10 = _ref9._meta) != null ? _ref10.id : void 0 : void 0));
      } else {
        res.end("UNKONWN");
      }
    }
  });

  app.listen(3005);

}).call(this);
