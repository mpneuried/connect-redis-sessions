(function() {
  var HOST, PORT, SERVERS, querystring, rand, req, request, should,
    slice = [].slice;

  should = require('should');

  querystring = require('querystring');

  rand = require('randoms');

  request = require("request");

  SERVERS = {
    connect: require("./testservers/connect"),
    express: require("./testservers/express")
  };

  PORT = process.env.PORT || 3005;

  HOST = "http://localhost:" + PORT + "/";

  req = function() {
    var _opt, _qs, _uri, app, arg, cb, data, i, jar, ref;
    arg = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
    app = arg[0], data = arg[1], jar = arg[2];
    _uri = HOST;
    if (app != null ? app.length : void 0) {
      _uri += app + "/";
    }
    if ((data != null) && ((ref = Object.keys(data)) != null ? ref.length : void 0)) {
      _qs = querystring.stringify(data);
    }
    if (_qs != null ? _qs.length : void 0) {
      _uri += "?" + _qs;
    }
    _opt = {
      uri: _uri,
      method: "GET"
    };
    if (jar != null) {
      _opt.jar = jar;
    }
    request(_opt, function(err, resp, body) {
      if (err) {
        throw err;
        return;
      }
      cb(body);
    });
  };

  describe("----- connect resid sessions TESTS -----", function() {
    var _servername, app;
    for (_servername in SERVERS) {
      app = SERVERS[_servername];
      describe((_servername.toUpperCase()) + " Tests - ", function() {
        var _k, apps, jars, server, uid, uids;
        server = null;
        apps = {
          A: rand.string.lower(10),
          B: rand.string.lower(10)
        };
        uids = {
          A: rand.string.alphaNum(5),
          B: rand.string.alphaNum(5),
          C: rand.string.alphaNum(5),
          D: rand.string.alphaNum(5)
        };
        jars = {};
        for (_k in uids) {
          uid = uids[_k];
          jars[_k] = request.jar();
        }
        before(function(done) {
          server = app.listen(PORT, function() {
            done();
          });
        });
        after(function(done) {
          server.close(done);
        });
        it("first check", function(done) {
          req(null, {}, jars.A, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        it("first check with appname", function(done) {
          req("testA", {}, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        it("first check with noop", function(done) {
          req(apps.A, {
            noop: 1
          }, jars.A, function(body) {
            body.should.equal("EMPTY");
            done();
          });
        });
        it("upgrade with id", function(done) {
          req(apps.A, {
            upgrade: uids.A
          }, jars.A, function(body) {
            body.should.equal("LOGGED IN - USER: " + uids.A);
            done();
          });
        });
        it("check session of first user", function(done) {
          req(apps.A, null, jars.A, function(body) {
            body.should.equal("USER: " + uids.A);
            done();
          });
        });
        it("destroy session of first user", function(done) {
          req(apps.A, {
            destroy: 1
          }, jars.A, function(body) {
            body.should.equal("killed + 1");
            done();
          });
        });
        it("recheck session of first user after destroy", function(done) {
          req(apps.A, null, jars.A, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        it("upgrade with user B", function(done) {
          req(apps.A, {
            upgrade: uids.B
          }, jars.B, function(body) {
            body.should.equal("LOGGED IN - USER: " + uids.B);
            done();
          });
        });
        it("upgrade with user C", function(done) {
          req(apps.A, {
            upgrade: uids.C
          }, jars.C, function(body) {
            body.should.equal("LOGGED IN - USER: " + uids.C);
            done();
          });
        });
        it("check session of user B", function(done) {
          req(apps.A, null, jars.B, function(body) {
            body.should.equal("USER: " + uids.B);
            done();
          });
        });
        it("check session of user B in another app", function(done) {
          req(apps.B, null, jars.B, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        it("check activity from user B (number of sessions in app)", function(done) {
          req(apps.A, {
            activity: 1
          }, jars.B, function(body) {
            body.should.equal("USER: " + uids.B + "\n{\"activity\":2}");
            done();
          });
        });
        it("check activity from user B", function(done) {
          req(apps.A, {
            soapp: 1
          }, jars.B, function(body) {
            var data, i, len, ref, ref1, session, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.B);
            data = JSON.parse(data);
            data.sessions.should.length(2);
            ref1 = data.sessions;
            for (i = 0, len = ref1.length; i < len; i++) {
              session = ref1[i];
              [uids.B, uids.C].should.containEql(session.id);
            }
            done();
          });
        });
        it("check activity from user C", function(done) {
          req(apps.A, {
            soapp: 1
          }, jars.C, function(body) {
            var data, i, len, ref, ref1, session, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.C);
            data = JSON.parse(data);
            data.sessions.should.length(2);
            ref1 = data.sessions;
            for (i = 0, len = ref1.length; i < len; i++) {
              session = ref1[i];
              [uids.B, uids.C].should.containEql(session.id);
            }
            done();
          });
        });
        it("check soid of user B", function(done) {
          req(apps.A, {
            soid: 1
          }, jars.B, function(body) {
            var data, i, len, ref, ref1, session, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.B);
            data = JSON.parse(data);
            data.sessions.should.length(1);
            ref1 = data.sessions;
            for (i = 0, len = ref1.length; i < len; i++) {
              session = ref1[i];
              uids.B.should.containEql(session.id);
            }
            done();
          });
        });
        it("upgrade with user D", function(done) {
          req(apps.A, {
            upgrade: uids.D
          }, jars.D, function(body) {
            body.should.equal("LOGGED IN - USER: " + uids.D);
            done();
          });
        });
        it("check activity from user B", function(done) {
          req(apps.A, {
            soapp: 1
          }, jars.B, function(body) {
            var data, i, len, ref, ref1, session, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.B);
            data = JSON.parse(data);
            data.sessions.should.length(3);
            ref1 = data.sessions;
            for (i = 0, len = ref1.length; i < len; i++) {
              session = ref1[i];
              [uids.B, uids.C, uids.D].should.containEql(session.id);
            }
            done();
          });
        });
        it("destroy session of user B", function(done) {
          req(apps.A, {
            destroy: 1
          }, jars.B, function(body) {
            body.should.equal("killed + 1");
            done();
          });
        });
        it("check activity from user C", function(done) {
          req(apps.A, {
            soapp: 1
          }, jars.C, function(body) {
            var data, i, len, ref, ref1, session, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.C);
            data = JSON.parse(data);
            data.sessions.should.length(2);
            ref1 = data.sessions;
            for (i = 0, len = ref1.length; i < len; i++) {
              session = ref1[i];
              [uids.C, uids.D].should.containEql(session.id);
              [uids.B].should.not.containEql(session.id);
            }
            done();
          });
        });
        it("set data for user C", function(done) {
          req(apps.A, {
            save: 1,
            xyz: 42,
            abc: 23
          }, jars.C, function(body) {
            var data, ref, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.C);
            data.slice(0, 7).should.equal("SAVED: ");
            data = JSON.parse(data.slice(7));
            data.should.eql({
              xyz: "42",
              abc: "23"
            });
            done();
          });
        });
        it("set data for user C, overwite one", function(done) {
          req(apps.A, {
            save: 1,
            xyz: 666
          }, jars.C, function(body) {
            var data, ref, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.C);
            data.slice(0, 7).should.equal("SAVED: ");
            data = JSON.parse(data.slice(7));
            data.should.eql({
              xyz: "666",
              abc: "23"
            });
            done();
          });
        });
        it("set data for user C, clear one", function(done) {
          req(apps.A, {
            save: 1,
            abc: null
          }, jars.C, function(body) {
            var data, ref, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.C);
            data.slice(0, 7).should.equal("SAVED: ");
            data = JSON.parse(data.slice(7));
            data.should.eql({
              xyz: "666",
              abc: null
            });
            done();
          });
        });
        it("check activity from user C", function(done) {
          req(apps.A, {
            soapp: 1
          }, jars.C, function(body) {
            var data, i, len, ref, ref1, session, usr;
            ref = body.split("\n"), usr = ref[0], data = ref[1];
            usr.should.equal("USER: " + uids.C);
            data = JSON.parse(data);
            data.sessions.should.length(2);
            ref1 = data.sessions;
            for (i = 0, len = ref1.length; i < len; i++) {
              session = ref1[i];
              [uids.C, uids.D].should.containEql(session.id);
              [uids.B].should.not.containEql(session.id);
            }
            done();
          });
        });
        it("destroy all sessions of user C", function(done) {
          req(apps.A, {
            destroyall: 1
          }, jars.C, function(body) {
            body.should.equal("USER: " + uids.C + "\n1");
            done();
          });
        });
        it("check session of user C", function(done) {
          req(apps.A, null, jars.C, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        jars.D2 = request.jar();
        jars.D3 = request.jar();
        it("create second session for user D", function(done) {
          req(apps.A, {
            upgrade: uids.D
          }, jars.D2, function(body) {
            body.should.equal("LOGGED IN - USER: " + uids.D);
            done();
          });
        });
        it("create thrid session for user D", function(done) {
          req(apps.A, {
            upgrade: uids.D
          }, jars.D3, function(body) {
            body.should.equal("LOGGED IN - USER: " + uids.D);
            done();
          });
        });
        it("check session of user D in first jar", function(done) {
          req(apps.A, null, jars.D, function(body) {
            body.should.equal("USER: " + uids.D);
            done();
          });
        });
        it("check session of user D in second jar", function(done) {
          req(apps.A, null, jars.D2, function(body) {
            body.should.equal("USER: " + uids.D);
            done();
          });
        });
        it("check session of user D in third jar", function(done) {
          req(apps.A, null, jars.D3, function(body) {
            body.should.equal("USER: " + uids.D);
            done();
          });
        });
        it("destroy session of user D in third jar", function(done) {
          req(apps.A, {
            destroy: 1
          }, jars.D3, function(body) {
            body.should.equal("killed + 1");
            done();
          });
        });
        it("check session of user D in first jar", function(done) {
          req(apps.A, null, jars.D, function(body) {
            body.should.equal("USER: " + uids.D);
            done();
          });
        });
        it("check session of user D in second jar", function(done) {
          req(apps.A, null, jars.D2, function(body) {
            body.should.equal("USER: " + uids.D);
            done();
          });
        });
        it("check session of user D in third jar", function(done) {
          req(apps.A, null, jars.D3, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        it("destroy all other sessions of user D", function(done) {
          req(apps.A, {
            destroyall: 1
          }, jars.D2, function(body) {
            body.should.equal("USER: " + uids.D + "\n2");
            done();
          });
        });
        it("check session of user D in first jar", function(done) {
          req(apps.A, null, jars.D, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        it("check session of user D in second jar", function(done) {
          req(apps.A, null, jars.D2, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
        it("check session of user D in third jar", function(done) {
          req(apps.A, null, jars.D3, function(body) {
            body.should.equal("UNKOWN");
            done();
          });
        });
      });
    }
  });

}).call(this);
