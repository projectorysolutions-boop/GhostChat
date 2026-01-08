const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// maxHttpBufferSize set to 1e8 (100MB) to allow file transfers
const io = new Server(server, { 
    maxHttpBufferSize: 1e8 
});

// This serves your index.html from a folder named 'public'
app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('join-room', (roomCode) => {
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.to(roomCode).emit('receive-content', { 
            type: 'system', 
            message: 'A participant has joined the session' 
        });
    });

    socket.on('send-content', (data) => {
        io.to(data.room).emit('receive-content', data);
    });

    socket.on('disconnect', () => {
        if (socket.roomCode) {
            io.to(socket.roomCode).emit('receive-content', {
                type: 'system',
                message: 'A participant has left. Connection terminated.'
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});