const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
  }, 
});
const PORT = process.env.PORT || 3001;
const path = require("path");

let socketList = {};

io.on("connection", (socket) => {
  console.log(`socket connected ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected! ${socket.id}`);
    socket.disconnect();
  });

  socket.on("BE-check-user", ({ roomId, userName }) => {
    let error = false;
    //to get a list of clients (sockets) in the specified room.
    const clients = io.sockets.in(roomId);

    // if (clients) {
    //   clients.forEach((socketId) => {
    //     const socket = io.sockets.sockets.get(socketId);
    //     // You can now interact with the socket

    //   });
    // }
    socket.emit("FE-error-user-exist", { error });
  });

  // const users=[];
  // // console.log("clients ",clients)
  // clients?.forEach((client)=>{
  //   // console.log(client);
  //   users?.push({userId:client,info:socketList[client]});
  // })
  // console.log("users ");
  // socket.broadcast.to(roomId).emit('FE-user-join',users);
  socket.on("BE-join-room", ({ roomId, userName }) => {
    console.log(roomId, userName);
    socket.join(roomId);
    socketList[socket.id] = { userName, video: true, audio: true };
    // const clients=io.sockets.in(roomId)
    try {
      const clients = io.sockets.adapter.rooms[roomId]?.sockets;
      const users = [];

      if (clients) {
        Object.keys(clients).forEach((clientId) => {
          users.push({ userId: clientId, info: socketList[clientId] });
        });
      }

      console.log("users ", users);
      socket.broadcast.to(roomId).emit("FE-user-join", users);
    } catch (error) {
      io.sockets.in(roomId).emit("FE-error-user-exist", { err: true });
    }
  });

  //user1
  socket.on("BE-call-user", ({ userToCall, from, signal }) => {
    socket.to(userToCall).emit("FE-receive-call", {
      //to user2
      signal, //user1
      from, //user1
      info: socketList[socket.id],
    });
  });

  //user2
  socket.on("BE-accept-call", ({ signal, to }) => {
    socket.to(to).emit("FE-call-accepted", {
      // call to user1
      signal, //user2
      answerId: socket.id,
    });
  });

  socket.on("BE-leave-room", ({ roomId, leaver }) => {
    if (socketList[socket.id]) {
      delete socketList[socket.id];

      socket.broadcast
        .to(roomId)
        .emit("FE-user-leave", { userId: socket.id, userName: leaver });

      socket.leave(roomId);
    }
  });

  socket.on('BE-send-message', ({ roomId, msg, sender }) => {
    io.sockets.in(roomId).emit('FE-receive-message', { msg, sender });
  });

  socket.on('BE-toggle-camera-audio', ({ roomId, switchTarget }) => {
    if (switchTarget === 'video') {
      socketList[socket.id].video = !socketList[socket.id].video;
    } else {
      socketList[socket.id].audio = !socketList[socket.id].audio;
    }
    socket.broadcast
      .to(roomId)
      .emit('FE-toggle-camera', { userId: socket.id, switchTarget });
  });

});
http.listen(PORT, () => {
  console.log("Connected : 3001");
});
