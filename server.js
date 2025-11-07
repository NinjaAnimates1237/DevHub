// server.js (replace old Socket.IO logic with this)

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const users = {}; // { socketId: username }
const admins = new Set(["NinjaIsCool"]); // Default admin

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("setUsername", (username) => {
    users[socket.id] = username;
    io.emit("chatMessage", { user: "System", msg: `${username} joined the chat.` });
  });

  socket.on("chatMessage", (msg) => {
    const user = users[socket.id];
    if (!user) return;
    io.emit("chatMessage", { user, msg });
  });

  socket.on("makeAdmin", (target) => {
    const requester = users[socket.id];
    if (admins.has(requester)) {
      admins.add(target);
      io.emit("notification", { msg: `${target} was made an admin by ${requester}` });
    } else {
      socket.emit("notification", { msg: "You are not authorized to do that." });
    }
  });

  socket.on("banUser", (target) => {
    const requester = users[socket.id];
    if (admins.has(requester)) {
      const targetSocket = Object.keys(users).find((id) => users[id] === target);
      if (targetSocket) {
        io.to(targetSocket).emit("banned");
        io.emit("notification", { msg: `${target} was banned by ${requester}` });
      }
    }
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    delete users[socket.id];
    io.emit("chatMessage", { user: "System", msg: `${username} left.` });
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
