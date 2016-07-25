(function() {
  var ConnectRedisSessions, DEBUG, _getAppName, app, bodyparser, connect, cookieparser, logger, query;

  connect = require("connect");

  ConnectRedisSessions = require("../../");

  cookieparser = require("cookie-parser");

  bodyparser = require("body-parser");

  logger = require("morgan");

  query = require('connect-query');

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

  DEBUG = process.env.DEBUG != null ? true : false;

  if (process.env.LOG != null) {
    app.use(logger("dev"));
  }

  app.use(function(req, res, next) {
    console.log("REQ", req.headers);
    next();
  }).use(query()).use(cookieparser()).use(bodyparser()).use(ConnectRedisSessions({
    app: _getAppName,
    debug: DEBUG,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  }));

  require("./_routes")(app, DEBUG);

  module.exports = app;

}).call(this);
