const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let users = {}; // { socket.id: { username, serverId, isAdmin, banned } }
let notifications = {}; // { username: [messages] }

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("joinServer", ({ username, serverId }) => {
    if (!username || !serverId) return;

    // Auto-admin for NinjaIsCool 😎
    const isAdmin = username === "NinjaIsCool";

    users[socket.id] = { username, serverId, isAdmin, banned: false };
    socket.join(serverId);

    io.to(serverId).emit("chatMessage", {
      user: "System",
      text: `${username} joined server ${serverId}`,
    });

    // If auto-admin, notify others
    if (isAdmin) {
      io.to(serverId).emit("chatMessage", {
        user: "System",
        text: `${username} is an Admin! 👑`,
      });
    }
  });

  socket.on("chatMessage", (msg) => {
    const user = users[socket.id];
    if (!user || user.banned) return;

    io.to(user.serverId).emit("chatMessage", {
      user: user.username,
      text: msg,
    });
  });

  socket.on("makeAdmin", (targetUser) => {
    const user = users[socket.id];
    if (!user || !user.isAdmin) return;

    const target = Object.entries(users).find(
      ([, info]) =>
        info.username === targetUser && info.serverId === user.serverId
    );
    if (target) {
      users[target[0]].isAdmin = true;
      sendNotification(targetUser, `${user.username} made you an admin!`);
      io.to(user.serverId).emit("chatMessage", {
        user: "System",
        text: `${targetUser} is now an Admin! 👑`,
      });
    }
  });

  socket.on("banUser", (targetUser) => {
    const user = users[socket.id];
    if (!user || !user.isAdmin) return;

    const target = Object.entries(users).find(
      ([, info]) =>
        info.username === targetUser && info.serverId === user.serverId
    );
    if (target) {
      users[target[0]].banned = true;
      sendNotification(targetUser, `${user.username} banned you.`);
      io.to(target[0]).emit("banned");
      io.to(user.serverId).emit("chatMessage", {
        user: "System",
        text: `${targetUser} was banned by ${user.username}.`,
      });
    }
  });

  socket.on("getNotifications", (username) => {
    socket.emit("notifications", notifications[username] || []);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.serverId).emit("chatMessage", {
        user: "System",
        text: `${user.username} left the server.`,
      });
      delete users[socket.id];
    }
  });

  function sendNotification(username, text) {
    if (!notifications[username]) notifications[username] = [];
    notifications[username].push(text);
  }
});

server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
