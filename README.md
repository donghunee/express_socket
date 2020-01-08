```js
//app.js

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
```

---

```js
//index.ejs

$(() => {
    const name = prompt('이름을 입력해주세요~');
    const target = prompt('이름을 입력해주세요~');

    const socket = io();

    let room = ['room1', 'room2','room3'];
    let num = 0;

    socket.emit('joinRoom', num, name);



    $('select').change(() => {
    //   socket.emit('leaveRoom', num, name);
    //   num++;
    //   num = num % 3;
    //   socket.emit('connect',name,target);

    //   socket.emit('joinRoom', num, name);
    });


    $('form').submit(() => {
    //   socket.emit('chat-msg', num, name, $('#m').val());
      socket.emit('chat-msg',name,target,$('#m').val());
      $('#m').val('');
      return false;
    });

    socket.on('chat-msg', (name, msg) => {
      $('#messages').append($('<li>').text(name + '  :  ' +
        msg));
    });

    socket.on('leaveRoom', (num, name) => {
      $('#messages').append($('<li>').text(name + '    leaved '
        + room[num] + ' :('));
    });

    socket.on('joinRoom', (num, name) => {
      $('#messages').append($('<li>').text(`${name}님이 ${room[num]}에 입장하셨습니다.`));
    });
  });
```
