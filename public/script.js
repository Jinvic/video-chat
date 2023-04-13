//在这里更改ip地址和端口号
const socket = io("172.20.10.4:3030");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
    document.querySelector(".main__left").style.display = "flex";
    document.querySelector(".main__left").style.flex = "1";
    document.querySelector(".main__right").style.display = "none";
    document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
    document.querySelector(".main__right").style.display = "flex";
    document.querySelector(".main__right").style.flex = "1";
    document.querySelector(".main__left").style.display = "none";
    document.querySelector(".header__back").style.display = "block";
});

const user = prompt("Enter your name");

//在这里更改ip地址和端口号
var peer = new Peer({
    host: '172.20.10.4',
    port: 3030,
    path: '/peerjs',
    config: {
        'iceServers': [
            {url: 'stun:stun01.sipphone.com'},
            {url: 'stun:stun.ekiga.net'},
            {url: 'stun:stunserver.org'},
            {url: 'stun:stun.softjoys.com'},
            {url: 'stun:stun.voiparound.com'},
            {url: 'stun:stun.voipbuster.com'},
            {url: 'stun:stun.voipstunt.com'},
            {url: 'stun:stun.voxgratia.org'},
            {url: 'stun:stun.xten.com'},
            {
                url: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            }
        ]
    },

    debug: 3
});

let videoList = {};
let cnt = 1;

let myVideoStream;
navigator.mediaDevices
    .getUserMedia({
        audio: true,
        video: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            console.log('someone call me');
            call.answer(stream);
            const video = document.createElement("video");
            addVideoId(video, call.peer);
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
    });

const connectToNewUser = (userId, stream) => {
    console.log('I call someone' + userId);
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    addVideoId(video, userId);
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });
};

peer.on("open", (id) => {
    console.log('my id is' + id);
    socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.append(video);
    });
};

//modify
socket.on("userDisconnect", (userId) => {
    deleteVideoStream(userId);
});
const addVideoId = (video, userId) => {
    video.setAttribute('id', cnt);
    videoList[userId] = cnt++;
};
const deleteVideoStream = (userId) => {
    const video = document.getElementById(videoList[userId]);
    if (video) {
        videoGrid.removeChild(video);
    } else {
        console.log("can't found the video element");
    }
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
    if (text.value.length !== 0) {
        socket.emit("message", text.value);
        text.value = "";
    }
});

text.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && text.value.length !== 0) {
        socket.emit("message", text.value);
        text.value = "";
    }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
// modify
const recordButton = document.querySelector("#recordButton");
var recordFlag = false;
var buffer;
var mediaRecoder;
recordButton.addEventListener("click", () => {
    if (recordFlag == false) {
        recordFlag = true;
        //开始录制
        buffer = [];
        mediaRecoder = new MediaRecorder(myVideoStream);
        mediaRecoder.ondataavailable = function (e) {
            if (e && e.data && e.data.size > 0) {
                buffer.push(e.data);
            }
        }

        mediaRecoder.start(10);
    } else {
        recordFlag = false;
        //停止录制
        mediaRecoder.stop();
        var blob = new Blob(buffer, {type: 'video/mp4'});
        console.log(blob);

        //自动下载
        //根据缓存数据生成url
        var url = window.URL.createObjectURL(blob);
        //创建一个a标签，通过a标签指向url来下载
        var a = document.createElement('a');
        a.href = url;
        a.style.display = 'none'; //不显示a标签
        a.download = new Date().toLocaleTimeString();
        a.click(); //调用a标签的点击事件进行下载
    }
    recordButton.classList.toggle("background__red");
});


muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        html = `<i class="fas fa-microphone-slash"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        html = `<i class="fas fa-microphone"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    }
});

stopVideo.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        html = `<i class="fas fa-video-slash"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        html = `<i class="fas fa-video"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    }
});

inviteButton.addEventListener("click", (e) => {
    prompt(
        "Copy this link and send it to people you want to meet with",
        window.location.href
    );
});

socket.on("createMessage", (message, userName) => {
    messages.innerHTML =
        messages.innerHTML +
        `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});
