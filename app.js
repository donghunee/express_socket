var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

// var server = require('http').Server(app)
// var io = require('socket.io')(server);


var indexRouter = require('./routes/index');


let room = ['room1', 'room2', 'room3'];
let a = 0;


app.io = require('socket.io')();

app.io.on('connection',(socket) => {

  socket.on('leaveRoom', (num, name) => {
    socket.leave(room[num], () => {
      console.log(name + ' leave a ' + room[num]);
      app.io.to(room[num]).emit('leaveRoom', num, name);
    });
  });

  socket.on('joinRoom', (num, name) => {
    socket.join(room[num], () => {
      console.log(name + ' join a ' + room[num]);
      app.io.to(room[num]).emit('joinRoom', num, name);
    });
  });

  socket.on('disconnect', () => {
      console.log('user disconnected');
  });

  socket.on('chat-msg', (num, name, msg) => {
    a = num;
    app.io.to(room[a]).emit('chat-msg', name, msg);
  });

});

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

app.use('/', indexRouter);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
