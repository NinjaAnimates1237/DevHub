const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let users = {};
let notifications = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("setUsername", (username) => {
    socket.username = username;
    users[socket.id] = username;

    if (username === "NinjaIsCool") {
      socket.emit("isAdmin", true);
    }

    io.emit("userList", Object.values(users));
  });

  socket.on("chatMessage", (msg) => {
    if (!socket.username) return;
    io.emit("chatMessage", {
      user: socket.username,
      text: msg,
      time: new Date().toLocaleTimeString(),
    });
  });

  socket.on("sendNotification", (notif) => {
    notifications.push(notif);
    io.emit("newNotification", notif);
  });

  socket.on("banUser", (username) => {
