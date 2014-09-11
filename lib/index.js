(function() {
  var SessionHandler, SessionObject, pause;

  SessionHandler = require("./sessionhandler");

  SessionObject = require("./sessionobject");

  pause = require("pause");

  module.exports = function(options) {
    var fn, sessionHandler;
    sessionHandler = new SessionHandler(options);
    fn = function(req, res, next) {
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
      sessionHandler.getApp(req, (function(_this) {
        return function(err, appname) {
          var end, _pause;
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
          if (req.cookies[appname] != null) {
            req.sessionID = req.cookies[appname];
          } else {
            req.sessionID = null;
          }
          end = res.end;
          res.end = function(data, encoding) {
            res.end = end;
            if (!req.sessionID || (req.session == null)) {
              return res.end(data, encoding);
            }
            if (req._originalHash !== req.session.hash()) {
              req.session.save(function(err) {
                if (err) {
                  console.error(err);
                }
                res.end(data, encoding);
              });
            } else {
              res.end(data, encoding);
              return;
            }
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
            _pause = pause(req);
            sessionHandler.get(req, function(err, data) {
              var _next;
              _next = next;
              next = function(err) {
                _next(err);
                return _pause.resume();
              };
              if (err) {
                if (sessionHandler.debug) {
                  console.log("GET ERROR", err);
                }
                req.sessionID = null;
                req.session = new SessionObject(sessionHandler, req);
                next();
                return;
              }
              if (data == null) {
                req.sessionID = null;
                req.session = new SessionObject(sessionHandler, req);
                next();
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
        };
      })(this));
    };
    fn.handler = sessionHandler;
    return fn;
  };

}).call(this);
