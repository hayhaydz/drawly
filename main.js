const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const socketOptions = {
    cors: {
        origin: "*"
    }
};
const io = new Server(server, socketOptions);

io.on('connection', (socket) => {
    console.log('a user has joined!');

    socket.on('chat', (message) => {
        io.emit('chat', message);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.get("/", (req, res) => {
    res.send("Websocket Server");
});

app.use((req, res, next) => {
    const error = new Error(`Cannot find ${req.originalUrl} on this server!`);
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
        status: 'fail',
        message: error.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3080;
server.listen(PORT, () => console.log(`Server listening on the port:: ${PORT}`));