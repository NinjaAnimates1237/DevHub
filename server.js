const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

const servers = {}; // { serverId: [ {id, user} ] }

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("createServer", (user) => {
    const serverId = Math.random().toString(36).substring(2, 8);
    servers[serverId] = [{ id: socket.id, user }];
    socket.join(serverId);
    socket.emit("serverCreated", { serverId });
    console.log(`${user} created server ${serverId}`);
  });

  socket.on("joinServer", ({ serverId, user }) => {
    if (servers[serverId]) {
      servers[serverId].push({ id: socket.id, user });
      socket.join(serverId);
      socket.emit("serverJoined", { serverId });
      io.to(serverId).emit("updateUsers", servers[serverId].map(u => u.user));
      console.log(`${user} joined ${serverId}`);
    } else {
      socket.emit("message", { user: "System", msg: "❌ Server not found!" });
    }
  });

  socket.on("sendMessage", ({ serverId, user, msg }) => {
    if (servers[serverId]) {
      io.to(serverId).emit("message", { user, msg });
    }
  });

  socket.on("disconnect", () => {
    for (const id in servers) {
      servers[id] = servers[id].filter(u => u.id !== socket.id);
      io.to(id).emit("updateUsers", servers[id].map(u => u.user));
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
