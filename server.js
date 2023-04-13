//导入必要的模块和库
const express = require("express");
const app = express();
const server = require("http").Server(app);
const {v4: uuidv4} = require("uuid");

const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
});

// 配置WebRTC Peer Server
const {ExpressPeerServer} = require("peer");
const opinions = {
    debug: true,
}
app.use("/peerjs", ExpressPeerServer(server, opinions));

// 设置静态文件夹和模板引擎
app.set("view engine", "ejs");
app.use(express.static("public"));

// 设置应用程序主页路由
app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

// 设置应用程序房间页路由
app.get("/:room", (req, res) => {
    res.render("room", {roomId: req.params.room});
});

let COUNT = false, MONITOR = true;
let userList = {};//socket.id和userId的对应。
let roomList = {};//roomID和房间人数的对应。

let socketPeerId = {};//peerID和socketID的对应。
// 监听客户端的连接请求
io.on("connection", (socket) => {
    // console.log("new connection established");
    console.log("new connection established");

    let roomID;
    socket.on("join-room", (roomId, userId, userName) => {
        //modify
        roomID = roomId;
        socketPeerId[socket.id]=userId;
        io.to(roomId).emit("createMessage", '用户' + userName + '加入了房间', '【SYSTEM】');
        userList[socket.id] = userName;
        roomList[roomID] = (roomID in roomList) ? roomList[roomID] + 1 : 1;
        if (MONITOR) monitor_log(0, userList[socket.id], roomID);
        if (COUNT) count_log();


        socket.join(roomId);
        setTimeout(() => {
            socket.to(roomId).broadcast.emit("user-connected", userId);
        }, 1000)

        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });

    });

    //modify
    socket.on('disconnect', () => {
        if (MONITOR) monitor_log(1, userList[socket.id], roomID);

        io.to(roomID).emit("createMessage", '用户' + userList[socket.id] + '离开了房间', '【SYSTEM】');
        io.to(roomID).emit("userDisconnect", socketPeerId[socket.id]);
        delete userList[socket.id];

        roomList[roomID] -= 1;
        if (roomList[roomID] === 0) {
            delete roomList[roomID];
            console.log('room ' + roomID + 'has been closed');
        }

        if (COUNT) count_log();
    });
});

//modify
function count_log() {
    console.log("total users: " + Object.keys(userList).length);
    console.log("total rooms: " + Object.keys(roomList).length);
}

function monitor_log(flag, userName, roomID) {
    if (flag === 0)
        console.log('user ' + userName + ' joined room ' + roomID);
    else
        console.log('user ' + userName + ' has leaved room ' + roomID);
}

// 启动服务器
server.listen(process.env.PORT || 3030);


