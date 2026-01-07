const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

app.use(express.static('public'));

io.on('connection', (socket) => {
    
    socket.on('join-room', (roomCode) => {
        socket.join(roomCode);
        socket.roomCode = roomCode; // Store room code in the socket object

        // Tell others in the room someone joined
        socket.to(roomCode).emit('receive-content', { 
            type: 'system', 
            message: 'A participant has joined the session' 
        });
        
        // console.log(`User joined: ${roomCode}`);
    });

    socket.on('send-content', (data) => {
        io.to(data.room).emit('receive-content', data);
    });

    socket.on('disconnect', () => {
        // If the user was in a room, tell the others they left
        if (socket.roomCode) {
            io.to(socket.roomCode).emit('receive-content', {
                type: 'system',
                message: 'A participant has left. Connection terminated.'
            });
        }
        console.log('User disconnected');
    });
});

server.listen(3000, () => console.log('Server active on http://localhost:3000'));