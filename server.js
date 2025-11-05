const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const servers = {}; // { serverId: { users: {}, messages: [] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinServer", ({ username, serverId }) => {
    if (!servers[serverId]) {
      servers[serverId] = { users: {}, messages: [] };
    }

    socket.join(serverId);
    servers[serverId].users[socket.id] = username;

    io.to(serverId).emit("notification", `${username} joined the server!`);
    io.to(serverId).emit("chatHistory", servers[serverId].messages);
  });

  socket.on("sendMessage", ({ username, serverId, message }) => {
    if (!servers[serverId]) return;
    const msg = { username, message };
    servers[serverId].messages.push(msg);
    io.to(serverId).emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    for (const [serverId, data] of Object.entries(servers)) {
      if (data.users[socket.id]) {
        const username = data.users[socket.id];
        delete data.users[socket.id];
        io.to(serverId).emit("notification", `${username} left the server.`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
