const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let users = {}; // socket.id -> username
let admins = new Set(["NinjaIsCool"]);
let banned = new Set();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("setUsername", (username) => {
    if (banned.has(username)) {
      socket.emit("banned");
      socket.disconnect();
      return;
    }

    users[socket.id] = username;

    // Admin check
    if (admins.has(username)) {
      socket.emit("adminStatus", true);
    } else {
      socket.emit("adminStatus", false);
    }

    io.emit("userList", Object.values(users));
    console.log(`${username} joined`);
  });

  socket.on("sendMessage", (data) => {
    const username = users[socket.id];
    if (!username) return;

    io.emit("newMessage", { username, text: data });
  });

  // ✅ Admin banning
  socket.on("banUser", (target) => {
    const username = users[socket.id];
    if (!admins.has(username)) return;

    const targetSocket = Object.keys(users).find((id) => users[id] === target);
    if (targetSocket) {
      banned.add(target);
      io.to(targetSocket).emit("banned");
      io.sockets.sockets.get(targetSocket).disconnect();
      io.emit("serverNotification", `${target} was banned by ${username}`);
    }
  });

  // ✅ Give admin
  socket.on("makeAdmin", (target) => {
    const username = users[socket.id];
    if (!admins.has(username)) return;

    admins.add(target);
    io.emit("serverNotification", `${target} is now an admin!`);
  });

  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      io.emit("userList", Object.values(users));
      console.log(`${username} disconnected`);
    }
  });
});

server.listen(3000, () => console.log("✅ Server running on port 3000"));
