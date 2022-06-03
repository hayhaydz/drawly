const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*"
    }
});
const cors = require('cors');
const { addUser, getUser, deleteUser, getUsers } = require('./utils/users');
const appDao = require('./db/dao');

app.use(cors());

let strokes = [];
let stroke = {};

io.on('connection', (socket) => {
    console.log(`Client with ID of ${socket.id} connected!`);
    
    socket.on('login', ({ name, room }, callback) => {
        console.log(`Client with ID of ${socket.id} has logged in`);
        const { user, error } = addUser(socket.id, name, room);
        if(error) return callback(error);
        socket.join(user.room);
        socket.in(room).emit('notification', { title: 'Someone is here', description: `${user.name} just entered the room` });
        io.in(room).emit('users', getUsers(room));
        appDao.get_strokes(room, (res) => {
            console.log(res);
        });
        callback();
    });

    socket.on('sendMessage', message => {
        const user = getUser(socket.id);
        io.in(user.room).emit('message', { user: user.name, text: message });
    });

    socket.on('startDrawing', data => {
        const user = getUser(socket.id);
        stroke.room = user.room;
        stroke.start = data;
        socket.broadcast.to(user.room).emit('startDraw', { ...data });
    });

    socket.on('endDrawing', data => {
        const user = getUser(socket.id);
        stroke.end = data;
        appDao.add_stroke(stroke, (res) => {
            console.log(res);
            stroke = {};
        });
        socket.broadcast.to(user.room).emit('endDraw', { ...data });
    });

    socket.on('disconnect', () => {
        console.log(`Client with ID of ${socket.id} has disconnected`);
        const user = deleteUser(socket.id);
        if(user) {
            io.in(user.room).emit('notification', { title: 'Someone just left', description: `${user.name} just left the room` });
            io.in(user.room).emit('users', getUsers(user.room));
        }

        if(getUsers(user.room).length < 1) {
            appDao.delete_strokes(user.room, (res) => {
                console.log(res);
            });
        }
    });
});

app.get("/", (req, res) => {
    res.send("Websocket Server");
});

const PORT = process.env.PORT || 3080;
server.listen(PORT, () => console.log(`Server listening on the port:: ${PORT}`));