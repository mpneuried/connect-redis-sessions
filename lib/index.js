(function() {
  var SessionHandler, SessionObject;

  SessionHandler = require("./sessionhandler");

  SessionObject = require("./sessionobject");

  module.exports = function(connect, options) {
    var Cookie, sessionHandler, utils;
    Cookie = connect.session.Cookie;
    utils = connect.utils;
    sessionHandler = new SessionHandler(options, connect);
    return function(req, res, next) {
      var secret,
        _this = this;
      if (req.res == null) {
        req.res = res;
      }
      if (req.session) {
        return next();
      }
      if (!sessionHandler.ready) {
        if (sessionHandler.debug) {
          console.warn("Connection not ready");
        }
        next();
        return;
      }
      if (req.originalUrl.indexOf(sessionHandler.cookie.path || "/")) {
        return next();
      }
      secret = this.secret || req.secret;
      if (!sessionHandler.secret) {
        sessionHandler._error("no-secret", res);
      }
      sessionHandler.getApp(req, function(err, appname) {
        var end, pause, rawCookie, unsignedCookie;
        if (err) {
          sessionHandler._error(err, res);
          return;
        }
        req._appname = appname;
        if (sessionHandler.debug) {
          console.log("use appname: ", appname);
        }
        if (req.cookies == null) {
          sessionHandler._error("cookies-disabled", res);
          return;
        }
        rawCookie = req.cookies[appname];
        unsignedCookie = req.signedCookies[appname];
        if (!unsignedCookie && rawCookie) {
          unsignedCookie = utils.parseSignedCookie(rawCookie, sessionHandler.secret);
        }
        req._unsignedCookie = unsignedCookie;
        req.sessionID = unsignedCookie;
        end = res.end;
        res.end = function(data, encoding) {
          res.end = end;
          if (!req.sessionID) {
            return res.end(data, encoding);
          }
          req.session.save(function(err) {
            if (err) {
              console.error(err.stack);
            }
            res.end(data, encoding);
          });
        };
        if (!(appname != null ? appname.length : void 0)) {
          if (sessionHandler.debug) {
            console.log("no appname defined so run next");
          }
          req.sessionID = null;
          req.session = new SessionObject(sessionHandler, req);
          next();
          return;
        }
        if (!req.sessionID) {
          if (sessionHandler.debug) {
            console.log("no SID found so run next");
          }
          req.sessionID = null;
          req.session = new SessionObject(sessionHandler, req);
          next();
          return;
        } else {
          pause = utils.pause(req);
          sessionHandler.get(req, function(err, data) {
            var _next;
            _next = next;
            next = function(err) {
              _next(err);
              return pause.resume();
            };
            if (err) {
              next(err);
              return;
            }
            if (sessionHandler.debug) {
              console.log("SESSION found", data);
            }
            sessionHandler.createSession(req, data);
            req._originalHash = req.session.hash();
            req._originalId = req.session.id;
            next();
          });
        }
      });
    };
  };

}).call(this);
