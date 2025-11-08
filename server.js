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
    for (let [id, name] of Object.entries(users)) {
      if (name === username) {
        io.to(id).emit("banned");
        io.emit("sendNotification", `${username} was banned by ${socket.username}`);
        io.sockets.sockets.get(id).disconnect(true);
        delete users[id];
      }
    }
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("userList", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
