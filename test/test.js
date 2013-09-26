(function() {
  var ConnectRedisSessions, assert, connect, store;

  assert = require("assert");

  connect = require("connect");

  ConnectRedisSessions = require("./")(connect);

  store = new ConnectRedisSessions({
    app: "test"
  });

  process.once("uncaughtException", function(err) {
    console.error(err);
  });

  store.set("123", {
    cookie: {
      maxAge: 2000
    }
  });

}).call(this);
