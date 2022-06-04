const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*"
    }
});
const cors = require('cors');
const redis = require('redis');

const { addUser, getUser, deleteUser, getUsers } = require('./utils/users');
const { REDIS_URL } = require('./config.js');

app.use(cors());
const client = redis.createClient({
    url: `redis://${REDIS_URL}`
});
client.on('error', (err) => console.log('Redis Client Error', err));
(async () => {
    await client.connect();
})();

let strokes = [];
let stroke = {};

io.on('connection', async (socket) => {
    console.log(`Client with ID of ${socket.id} connected!`);
    
    socket.on('login', async ({ name, room }, callback) => {
        console.log(`Client with ID of ${socket.id} has logged in`);
        const { user, error } = addUser(socket.id, name, room);
        if(error) return callback(error);
        socket.join(user.room);
        socket.in(room).emit('notification', { title: 'Someone is here', description: `${user.name} just entered the room` });
        io.in(room).emit('users', getUsers(room));

        callback();
    });

    socket.on('checkStrokeSave', async (data) => {
        strokes = await client.lRange(JSON.stringify({"type": "stroke", "room": data.room}), 0, -1);
        if(strokes !== null && strokes.length > 1) {
            for(let i = 0; i < strokes.length; i++) {
                let stroke = JSON.parse(strokes[i]);
                socket.emit('startDraw', stroke.start);
                socket.emit('endDraw', stroke.end);
            }
            
        }
    });

    socket.on('startDrawing', data => {
        const user = getUser(socket.id);
        if(user) {
            stroke.room = user.room;
            stroke.start = data;
            socket.broadcast.to(user.room).emit('startDraw', { ...data });
        }
    });

    socket.on('endDrawing', async (data) => {
        const user = getUser(socket.id);
        if(user) {
            stroke.end = data;
            socket.broadcast.to(user.room).emit('endDraw', { ...data });
            await client.lPush(JSON.stringify({"type": "stroke", "room": stroke.room}), JSON.stringify(stroke), { EX: 60 * 60 * 24 });
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Client with ID of ${socket.id} has disconnected`);
        const user = deleteUser(socket.id);
        if(user) {
            io.in(user.room).emit('notification', { title: 'Someone just left', description: `${user.name} just left the room` });
            io.in(user.room).emit('users', getUsers(user.room));
            if(getUsers(user.room).length < 1) {
                await client.del(JSON.stringify({"type": "stroke", "room": user.room}));
            }
        }
    });
});

app.get("/", async (req, res) => {
    // await client.lPush(JSON.stringify({"type": "stroke", "room": "123"}), JSON.stringify({coord: {x: 1, y: 2}, c: {r:0, g:0, b:0, a: 0}, sw: 2}));
    // await client.lPush('strokes', 'Syd');
    // await client.del(JSON.stringify({"type": "stroke", "room": "123"}));
    // const value = await client.lRange(JSON.stringify({"type": "stroke", "room": "123"}), 0, -1);
    // console.log(value);
    res.send("Websocket Server");
});

const PORT = process.env.PORT || 3080;
server.listen(PORT, () => console.log(`Server listening on the port:: ${PORT}`));