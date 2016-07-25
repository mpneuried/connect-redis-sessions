(function() {
  module.exports = function(app, DEBUG) {
    app.use(function(req, res) {
      var _k, _v, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
      if (req.query.noop != null) {
        res.end("EMPTY");
        return;
      }
      if ((req.query.upgrade != null) && (req.query.ttl != null)) {
        req.session.upgrade(req.query.upgrade, req.query.ttl, function(err) {
          var ref, ref1;
          if (err) {
            res.end("ERROR: ", err);
            return;
          }
          if (DEBUG) {
            console.log("SESSION", req.session);
          }
          res.end("LOGGED IN - USER: " + ((ref = req.session) != null ? (ref1 = ref._meta) != null ? ref1.id : void 0 : void 0));
        });
        return;
      }
      if (req.query.upgrade != null) {
        req.session.upgrade(req.query.upgrade, function(err) {
          var ref, ref1;
          if (err) {
            res.end("ERROR: ", err);
            return;
          }
          if (DEBUG) {
            console.log("SESSION", req.session);
          }
          res.end("LOGGED IN - USER: " + ((ref = req.session) != null ? (ref1 = ref._meta) != null ? ref1.id : void 0 : void 0));
        });
        return;
      }
      if ((((ref = req.session) != null ? ref.id : void 0) != null) && (req.query.destroy != null)) {
        req.session.destroy(function(err, ok) {
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end("killed + " + ok);
        });
        return;
      }
      if ((((ref1 = req.session) != null ? ref1.id : void 0) != null) && (req.query.save != null)) {
        ref2 = req.query;
        for (_k in ref2) {
          _v = ref2[_k];
          if (_k !== "save") {
            if ((_v != null ? _v.length : void 0) && _v !== "null") {
              req.session[_k] = _v;
            } else {
              req.session[_k] = null;
            }
          }
        }
        res.end(("USER: " + ((ref3 = req.session) != null ? (ref4 = ref3._meta) != null ? ref4.id : void 0 : void 0) + "\n") + ("SAVED: " + (JSON.stringify(req.session.attributes()))));
        return;
      }
      if ((((ref5 = req.session) != null ? ref5.id : void 0) != null) && (req.query.soapp != null)) {
        req.session.soapp(function(err, data) {
          var ref6, ref7;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref6 = req.session) != null ? (ref7 = ref6._meta) != null ? ref7.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        });
        return;
      }
      if ((((ref6 = req.session) != null ? ref6.id : void 0) != null) && (req.query.soid != null)) {
        req.session.soid(function(err, data) {
          var ref7, ref8;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref7 = req.session) != null ? (ref8 = ref7._meta) != null ? ref8.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        });
        return;
      }
      if ((((ref7 = req.session) != null ? ref7.id : void 0) != null) && (req.query.activity != null)) {
        req.session.activity(function(err, data) {
          var ref8, ref9;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref8 = req.session) != null ? (ref9 = ref8._meta) != null ? ref9.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        });
        return;
      }
      if ((((ref8 = req.session) != null ? ref8.id : void 0) != null) && (req.query.destroyall != null)) {
        req.session.destroyall(function(err, data) {
          var ref10, ref9;
          if (err) {
            res.end("ERROR: " + err);
            return;
          }
          res.end(("USER: " + ((ref9 = req.session) != null ? (ref10 = ref9._meta) != null ? ref10.id : void 0 : void 0) + "\n") + JSON.stringify(data));
        });
        return;
      }
      if (req.session.id) {
        if (DEBUG) {
          console.log("SESSION", req.session.d.r);
        }
        res.end("USER: " + ((ref9 = req.session) != null ? (ref10 = ref9._meta) != null ? ref10.id : void 0 : void 0));
        return;
      }
      res.end("UNKOWN");
    });
    return app;
  };

}).call(this);
