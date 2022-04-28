const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*"
    }
});
const cors = require('cors');
const { addUser, getUser, deleteUser, getUsers } = require('./utils/users');

app.use(cors());

io.on('connection', (socket) => {
    console.log(`Client with ID of ${socket.id} connected!`);
    
    socket.on('login', ({ name, room }, callback) => {
        const { user, error } = addUser(socket.id, name, room);
        if(error) return callback(error);
        socket.join(user.room);
        socket.in(room).emit('notification', { title: 'Someone is here', description: `${user.name} just entered the room` });
        io.in(room).emit('users', getUsers(room));
        callback();
    });

    socket.on('sendMessage', message => {
        const user = getUser(socket.id);
        io.in(user.room).emit('message', { user: user.name, text: message });
    });

    socket.on('disconnect', () => {
        console.log('User has disconnected');
        const user = deleteUser(socket.id);
        if(user) {
            io.in(user.room).emit('notification', { title: 'Someone just left', description: `${user.name} just left the room` });
            io.in(user.room).emit('users', getUsers(user.room));
        }
    });
});

app.get("/", (req, res) => {
    res.send("Websocket Server");
});

const PORT = process.env.PORT || 3080;
server.listen(PORT, () => console.log(`Server listening on the port:: ${PORT}`));