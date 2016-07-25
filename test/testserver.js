(function() {
  var ConnectRedisSessions, _getAppName, app, connect;

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
    var _k, _v, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
    if (req.query.noop != null) {
      res.end("EMPTY");
      return;
    }
    if (req.query.upgrade != null) {
      req.session.upgrade(req.query.upgrade, (function(_this) {
        return function(err) {
          var ref, ref1;
          if (err) {
            res.end("ERROR: ", err);
            return;
          }
          console.log("SESSION", req.session);
          res.end("LOGGED IN - USER: " + ((ref = req.session) != null ? (ref1 = ref._meta) != null ? ref1.id : void 0 : void 0));
        };
      })(this));
    } else if ((((ref = req.session) != null ? ref.id : void 0) != null) && (req.query.destroy != null)) {
      req.session.destroy((function(_this) {
        return function(err, ok) {
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end("killed + " + ok);
        };
      })(this));
    } else if ((((ref1 = req.session) != null ? ref1.id : void 0) != null) && (req.query.save != null)) {
      ref2 = req.query;
      for (_k in ref2) {
        _v = ref2[_k];
        if (_k !== "save") {
          req.session[_k] = (_v != null ? _v.length : void 0) ? _v : null;
        }
      }
      res.end(("USER: " + ((ref3 = req.session) != null ? (ref4 = ref3._meta) != null ? ref4.id : void 0 : void 0) + "\n") + ("SAVED: " + (JSON.stringify(req.session.attributes()))));
      return;
    } else if ((((ref5 = req.session) != null ? ref5.id : void 0) != null) && (req.query.soapp != null)) {
      req.session.soapp((function(_this) {
        return function(err, data) {
          var ref6, ref7;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref6 = req.session) != null ? (ref7 = ref6._meta) != null ? ref7.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else if ((((ref6 = req.session) != null ? ref6.id : void 0) != null) && (req.query.soid != null)) {
      req.session.soid((function(_this) {
        return function(err, data) {
          var ref7, ref8;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref7 = req.session) != null ? (ref8 = ref7._meta) != null ? ref8.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else if ((((ref7 = req.session) != null ? ref7.id : void 0) != null) && (req.query.activity != null)) {
      req.session.activity((function(_this) {
        return function(err, data) {
          var ref8, ref9;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref8 = req.session) != null ? (ref9 = ref8._meta) != null ? ref9.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else if ((((ref8 = req.session) != null ? ref8.id : void 0) != null) && (req.query.destroyall != null)) {
      req.session.destroyall((function(_this) {
        return function(err, data) {
          var ref10, ref9;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref9 = req.session) != null ? (ref10 = ref9._meta) != null ? ref10.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        };
      })(this));
      return;
    } else {
      if (req.session.id) {
        console.log("SESSION", req.session.d.r);
        res.end("USER: " + ((ref9 = req.session) != null ? (ref10 = ref9._meta) != null ? ref10.id : void 0 : void 0));
      } else {
        res.end("UNKONWN");
      }
    }
  });

  app.listen(3005);

}).call(this);
