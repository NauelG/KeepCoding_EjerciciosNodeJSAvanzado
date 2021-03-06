'use strict';

const app = require('express')();
const server = require('http').Server(app);

const io = require('socket.io')(server);

app.get('/', (req, res, next)=> {
    res.sendFile(__dirname + '/index.html' );
});

io.on('connection', socket => {
    console.log('Nueva conexión de un cliente', socket.id);
    socket.on('chat message', msg => {
        console.log('Mensaje recibido', msg);
        io.emit('chat message', msg);
        setInterval(() => {
            socket.emit('Pasa un segundo');
        }, 1000);
    });
});

server.listen(3000, () => {
    console.log('Listening on port 3000')
});
