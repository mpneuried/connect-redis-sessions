(function() {
  var ConnectRedisSessions, app, connect, _getAppName,
    _this = this;

  connect = require("connect");

  ConnectRedisSessions = require("../");

  app = connect();

  _getAppName = function(req, cb) {
    var appname;
    appname = req._parsedUrl.pathname.split("/")[1];
    if (appname != null) {
      cb(null, appname);
    } else {
      cb(null);
    }
  };

  app.use(connect.logger("dev")).use(connect.query()).use(connect.cookieParser()).use(connect.bodyParser()).use(ConnectRedisSessions(connect, {
    secret: 'mysecret',
    app: _getAppName,
    debug: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  }));

  app.use(function(req, res) {
    var _k, _ref, _v,
      _this = this;
    if (req.query.upgrade != null) {
      req.session.upgrade(req.query.upgrade, function(err) {
        if (err) {
          res.end("ERROR: ", err);
          return;
        }
        console.log(req.session);
        res.end("LOGGED IN - USER: " + req.session._meta.id);
      });
    } else if (req.query.destroy != null) {
      req.session.destroy(function(err, ok) {
        console.log("AFTER DEST", err, ok);
        if (err) {
          res.end("ERROR: " + err);
          return;
        }
        res.end("killed + " + ok);
      });
    } else if (req.query.save != null) {
      _ref = req.query;
      for (_k in _ref) {
        _v = _ref[_k];
        if (_k !== "save") {
          req.session[_k] = _v;
        }
      }
      res.end("ERROR: " + (JSON.stringify(req.session.attributes())));
      return;
    } else if (req.query.soapp != null) {
      req.session.soapp(function(err, data) {
        if (err) {
          res.end("ERROR: " + err);
          return;
        }
        res.end(JSON.stringify(data));
      });
      return;
    } else if (req.query.soid != null) {
      req.session.soid(function(err, data) {
        if (err) {
          res.end("ERROR: " + err);
          return;
        }
        res.end(JSON.stringify(data));
      });
      return;
    } else if (req.query.activity != null) {
      req.session.activity(function(err, data) {
        if (err) {
          res.end("ERROR: " + err);
          return;
        }
        res.end(JSON.stringify(data));
      });
      return;
    } else if (req.query.destroyall != null) {
      req.session.destroyall(function(err, data) {
        if (err) {
          res.end("ERROR: " + err);
          return;
        }
        res.end(JSON.stringify(data));
      });
      return;
    } else {
      console.log("SESSION", req.session.id);
      if (req.session.id) {
        res.end("USER: " + req.session._meta.id);
      } else {
        res.end("UNKONWN");
      }
    }
  });

  app.listen(3005);

}).call(this);
