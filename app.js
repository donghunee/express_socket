var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// var server = require('http').Server(app)
// var io = require('socket.io')(server);

var indexRouter = require("./routes/index");

var q = require("./public/data/data");

function randomItem(a) {
  return a[Math.floor(Math.random() * a.length)];
}

var app = express();

app.io = require("socket.io")();

app.io.on("connection", (socket) => {
  setTimeout(sendHeartbeat, 9000); // 안드로이드의 경우엔 지속적인 핑퐁이 없을 경우 연결이 끊어지는 현상이 있어 setTimeout을 통해 관리

  app.io.to(socket.id).emit("start", socket.id); // 시작

  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName, () => {
      console.log("leave");
      try {
        const itemToFind = socket.adapter.rooms[roomName].userList.find(
          function (item) {
            return item.userID === socket.id;
          }
        );
        let idx = socket.adapter.rooms[roomName].userList.indexOf(itemToFind);
        if (idx > -1) {
          if (socket.adapter.rooms[roomName].userList[idx].king == true) {
            console.log("king emit");
            if (socket.adapter.rooms[roomName].userList[idx + 1]) {
              socket.adapter.rooms[roomName].userList[idx + 1].king = true;
            }

            if (
              socket.adapter.rooms[roomName].userList[idx].queryUser == true
            ) {
              if (socket.adapter.rooms[roomName].userList.length == idx + 1) {
                socket.adapter.rooms[roomName].userList[0].queryUser = true;
              } else {
                socket.adapter.rooms[roomName].userList[
                  idx + 1
                ].queryUser = true;
              }
            }
          } else {
            if (
              socket.adapter.rooms[roomName].userList[idx].queryUser == true
            ) {
              if (socket.adapter.rooms[roomName].userList.length == idx + 1) {
                socket.adapter.rooms[roomName].userList[0].queryUser = true;
              } else {
                socket.adapter.rooms[roomName].userList[
                  idx + 1
                ].queryUser = true;
              }
            }
          }
          socket.adapter.rooms[roomName].userList.splice(idx, 1);
        }
        if (socket.adapter.rooms[roomName].userList) {
          app.io
            .in(roomName)
            .emit("userList", socket.adapter.rooms[roomName].userList);
        } else {
        }
      } catch (error) {
        console.log(error);
      }
    });
  });

  socket.on("joinRoom", (roomName, name) => {
    socket.join(roomName, () => {
      let wrap = {};
      wrap.userID = socket.id;
      wrap.userNickname = name;
      roomName = roomName.toString();

      if (socket.adapter.rooms[roomName].length == 1) {
        wrap.king = true;
        wrap.queryUser = true;
      } else {
        wrap.king = false;
        wrap.queryUser = false;
      }

      if (!socket.adapter.rooms[roomName]["userList"]) {
        socket.adapter.rooms[roomName]["userList"] = [];
      }

      const itemToFind = socket.adapter.rooms[roomName].userList.find(function (
        item
      ) {
        return item.userID === socket.id;
      });

      let idx = socket.adapter.rooms[roomName].userList.indexOf(itemToFind);
      if (idx > -1) {
      } else {
        socket.adapter.rooms[roomName].userList.push(wrap);
        let userWrap = {};
        userWrap.userList = socket.adapter.rooms[roomName].userList;
        userWrap.question = randomItem(q);
      }
      app.io
        .in(roomName.toString())
        .emit("userList", socket.adapter.rooms[roomName].userList);
    });
  });

  socket.on("startGame", (roomName) => {
    if (!socket.adapter.rooms[roomName].userList) {
    } else {
      let userWrap = {};
      userWrap.userList = socket.adapter.rooms[roomName].userList;
      userWrap.question = randomItem(q);
      app.io.in(roomName.toString()).emit("gameState", userWrap);
    }
  });

  socket.on("continueGame", (roomName) => {
    const itemToFind = socket.adapter.rooms[roomName].userList.find(function (
      item
    ) {
      return item.queryUser === true;
    });
    let idx = socket.adapter.rooms[roomName].userList.indexOf(itemToFind);

    if (idx > -1) {
      socket.adapter.rooms[roomName].userList[idx].queryUser = false;
      if (socket.adapter.rooms[roomName].userList.length == idx + 1) {
        socket.adapter.rooms[roomName].userList[0].queryUser = true;
      } else {
        socket.adapter.rooms[roomName].userList[idx + 1].queryUser = true;
      }
    }
    let userWrap = {};
    userWrap.userList = socket.adapter.rooms[roomName].userList;
    userWrap.question = randomItem(q);
    app.io.in(roomName.toString()).emit("gameState", userWrap);
  });

  socket.on("questionOK", (roomName) => {
    app.io.in(roomName.toString()).emit("questionOK");
  });

  socket.on("questionPass", (roomName) => {
    let userWrap = {};

    const itemToFind = socket.adapter.rooms[roomName].userList.find(function (
      item
    ) {
      return item.queryUser === true;
    });
    let idx = socket.adapter.rooms[roomName].userList.indexOf(itemToFind);
    if (idx > -1) {
      socket.adapter.rooms[roomName].userList[idx].queryUser = false;
      if (socket.adapter.rooms[roomName].userList.length == idx + 1) {
        socket.adapter.rooms[roomName].userList[0].queryUser = true;
      } else {
        socket.adapter.rooms[roomName].userList[idx + 1].queryUser = true;
      }
    }
    userWrap.userList = socket.adapter.rooms[roomName].userList;
    userWrap.question = randomItem(q);
    app.io.in(roomName.toString()).emit("gameState", userWrap);
  });

  socket.on("vote", (roomName, isFront) => {
    roomName = roomName.toString();
    console.log(typeof roomName);
    console.log(socket.adapter.rooms[roomName]);
    if (!socket.adapter.rooms[roomName]["vote"]) {
      let wrap = {};
      wrap.front = 0;
      wrap.back = 0;
      wrap.number = 0;
      socket.adapter.rooms[roomName]["vote"] = wrap;
      if (isFront) {
        socket.adapter.rooms[roomName].vote.front += 1;
        socket.adapter.rooms[roomName].vote.number += 1;
      } else {
        socket.adapter.rooms[roomName].vote.number += 1;
        socket.adapter.rooms[roomName].vote.back += 1;
      }
    } else {
      if (isFront) {
        socket.adapter.rooms[roomName].vote.front += 1;
        socket.adapter.rooms[roomName].vote.number += 1;
      } else {
        socket.adapter.rooms[roomName].vote.number += 1;
        socket.adapter.rooms[roomName].vote.back += 1;
      }
    }

    let voteNum =
      socket.adapter.rooms[roomName].userList.length -
      socket.adapter.rooms[roomName].vote.number;
    console.log("vote : " + voteNum);
    if (voteNum <= 0) {
      //투표 다 끝남

      let voteWrap = {};
      voteWrap.front = socket.adapter.rooms[roomName].vote.front;
      voteWrap.back = socket.adapter.rooms[roomName].vote.back;
      // console.log(voteWrap);
      app.io.in(roomName.toString()).emit("voteOK", voteWrap);
      socket.adapter.rooms[roomName].vote.front = 0;
      socket.adapter.rooms[roomName].vote.back = 0;
      socket.adapter.rooms[roomName].vote.number = 0;
    } else {
      app.io.in(roomName.toString()).emit("voteNum", { voteNum: voteNum });
    }
  });

  socket.on("gameStatus", (roomName) => {
    app.io.in(roomName.toString()).emit("gameStatus");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("pong", function (data) {});

  function sendHeartbeat() {
    setTimeout(sendHeartbeat, 9000);
    app.io.emit("ping", { beat: 1 });
  }

  function findRoomIndex(socket) {}
});

function coinadd() {}

app.use("/", indexRouter);
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// app.get('/', function(req, res, next) {
//     var chatLogs;
//     client.lrange('chatLogs', -10, -1, (err, charArr) => {
//         chatLogs = _.map(charArr, function(char){ return JSON.parse(char); });
//         res.render('index', {
//             title: 'Chat App',
//             chatLogs: chatLogs
//         });
//     });
// });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
