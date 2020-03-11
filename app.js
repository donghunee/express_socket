var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// var server = require('http').Server(app)
// var io = require('socket.io')(server);

var indexRouter = require("./routes/index");

let room = ["room1", "room2", "room3"];
let a = 0;

var app = express();

app.io = require("socket.io")();

app.io.on("connection", socket => {
  console.log("연결");
  app.io.to(socket.id).emit("start", socket.id);

  socket.on("leaveRoom", roomName => {
    // socket.disconnect();
    // socket.conn.close();
    // console.log(roomName);
    socket.leave(roomName, () => {
      // console.log(roomName);
      // console.log(socket.adapter.rooms[roomName]);
      try {
        const itemToFind = socket.adapter.rooms[roomName].userList.find(
          function(item) {
            return item.userID === socket.id;
          }
        );

        // console.log(itemToFind);
        let idx = socket.adapter.rooms[roomName].userList.indexOf(itemToFind);
        if (idx > -1) {
          if (socket.adapter.rooms[roomName].userList[idx].king == true) {
            console.log("킹이 나갔다");
            if (socket.adapter.rooms[roomName].userList[idx + 1]) {
              socket.adapter.rooms[roomName].userList[idx + 1].king = true;
            }
          }
          socket.adapter.rooms[roomName].userList.splice(idx, 1);
        }
      } catch (error) {
        console.log(error);
      }
      // if (socket.adapter.rooms[roomName]) {
      // socket.adapter.rooms[roomName].userList.some(function(n) {
      //   // if (n.userID == socket.id) {
      //   //   console.log("eeqwe");
      //   // }

      // });
      // console.log(socket.adapter.rooms[roomName].userList);
      // if (socket.adapter.rooms[roomName].userList.length >= 1) {
      //   console.log("Qwe");
      // }
      app.io
        .in(roomName)
        .emit("userList", socket.adapter.rooms[roomName].userList);
      // }
    });
  });

  socket.on("joinRoom", (roomName, name) => {
    console.log(socket.id);
    socket.join(roomName, () => {
      // console.log(name + " join a " + roomName);
      socket.adapter.rooms[roomName].sockets[socket.id] = name;
      let wrap = {};
      wrap.userID = socket.id;
      wrap.userNickname = name;
      if (socket.adapter.rooms[roomName].length == 1) {
        wrap.king = true;
        wrap.queryUser = false;
      } else {
        wrap.king = false;
        wrap.queryUser = false;
      }
      if (!socket.adapter.rooms[roomName].userList) {
        socket.adapter.rooms[roomName].userList = [];
      }
      socket.adapter.rooms[roomName].userList.push(wrap);
      let userWrap = {};
      userWrap.userList = socket.adapter.rooms[roomName].userList;
      userWrap.question = "랜덤 질문";
      console.log(roomName.toString());
      console.log(socket.adapter.rooms[roomName].userList);
      app.io
        .in(roomName.toString())
        .emit("userList", socket.adapter.rooms[roomName].userList);
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    // socket.close();
    socket.disconnect();
    socket.conn.close();
  });

  socket.on("coin", (roomName, coin) => {
    if (!socket.adapter.rooms[roomName].count) {
      socket.adapter.rooms[roomName].count = 0;
    }
    socket.adapter.rooms[roomName].count += 1;
    if (!socket.adapter.rooms[roomName].yes) {
      socket.adapter.rooms[roomName].yes = 0;
    }
    if (!socket.adapter.rooms[roomName].no) {
      socket.adapter.rooms[roomName].no = 0;
    }
    if (coin == 0) {
    } else {
    }
    if (
      socket.adapter.rooms[roomName].count ==
      socket.adapter.rooms[roomName].length
    ) {
      app.io.to(roomName).emit("chat-msg", name, msg);
    }
  });
});

function coinadd() {}

// io.on('connection', function(socket){

//     var userName = socket.id;

//     io.to(socket.id).emit('change name', userName);

//     socket.on('changed name', function(receivedUserName) {
//         userName = receivedUserName;
//         io.to(socket.id).emit('change name', userName);
//     });

//     socket.on('disconnect', function(){
//         io.emit('leave', socket.id);
//     });

//     socket.on('send message', function(text){
//         var date = new Date();
//         client.rpush('chatLogs', JSON.stringify({
//             userName: socket.id,
//             message: text,
//             date: addZero(date.getHours()) + ":" + addZero(date.getMinutes())
//         }));
//         io.emit('receive message', {
//             userName: socket.id,
//             message: text,
//             date: addZero(date.getHours()) + ":" + addZero(date.getMinutes())
//         });
//     });
// });

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
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
