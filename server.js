const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const servers = {}; // { serverCode: { owner, admins, banned, members } }
const users = {};   // { socket.id: { username, serverCode } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins with username + serverCode
  socket.on("joinServer", ({ username, serverCode }) => {
    users[socket.id] = { username, serverCode };

    if (!servers[serverCode]) {
      servers[serverCode] = {
        owner: username,
        admins: [],
        banned: [],
        members: []
      };
    }

    const serverData = servers[serverCode];

    if (serverData.banned.includes(username)) {
      socket.emit("notification", {
        message: "You are banned from this server."
      });
      socket.disconnect();
      return;
    }

    serverData.members.push(username);
    socket.join(serverCode);

    io.to(serverCode).emit("notification", {
      message: `${username} joined the server!`
    });

    console.log(`${username} joined ${serverCode}`);
  });

  // Chat message
  socket.on("chatMessage", (msg) => {
    const user = users[socket.id];
    if (!user) return;
    const { username, serverCode } = user;
    io.to(serverCode).emit("message", { username, text: msg });
  });

  // Promote
  socket.on("promote", ({ serverCode, targetUser }) => {
    const user = users[socket.id];
    if (!user) return;

    const serverData = servers[serverCode];
    if (serverData.owner === user.username) {
      if (!serverData.admins.includes(targetUser)) {
        serverData.admins.push(targetUser);
        io.to(serverCode).emit("notification", {
          message: `${targetUser} was promoted to Admin by ${user.username}`
        });
      }
    }
  });

  // Ban
  socket.on("ban", ({ serverCode, targetUser }) => {
    const user = users[socket.id];
    if (!user) return;

    const serverData = servers[serverCode];
    if (
      serverData.owner === user.username ||
      serverData.admins.includes(user.username)
    ) {
      if (!serverData.banned.includes(targetUser)) {
        serverData.banned.push(targetUser);
        serverData.members = serverData.members.filter(
          (m) => m !== targetUser
        );
        io.to(serverCode).emit("notification", {
          message: `${targetUser} was banned by ${user.username}`
        });

        // Kick banned user if online
        for (const [id, data] of Object.entries(users)) {
          if (data.username === targetUser && data.serverCode === serverCode) {
            io.sockets.sockets.get(id)?.disconnect();
          }
        }
      }
    }
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const { username, serverCode } = user;
      const serverData = servers[serverCode];
      if (serverData) {
        serverData.members = serverData.members.filter((m) => m !== username);
        io.to(serverCode).emit("notification", {
          message: `${username} left the server`
        });
      }
      delete users[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
