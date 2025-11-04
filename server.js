const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Store servers and their users/messages
const servers = {}; // { serverId: { users: [], messages: [] } }

function generateServerId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// When a user connects
io.on("connection", (socket) => {
  console.log("🟢 A user connected");

  // Create a new server
  socket.on("createServer", (data) => {
    const serverId = generateServerId();
    servers[serverId] = { users: [], messages: [] };
    socket.emit("serverCreated", { serverId });
    console.log(`✅ Server created: ${serverId}`);
  });

  // Join a server
  socket.on("joinServer", ({ serverId, user }) => {
    if (!servers[serverId]) {
      socket.emit("message", { user: "System", msg: "❌ Invalid server ID." });
      return;
    }

    socket.join(serverId);
    socket.serverId = serverId;
    socket.username = user;

    if (!servers[serverId].users.includes(user)) {
      servers[serverId].users.push(user);
    }

    console.log(`${user} joined ${serverId}`);

    // Notify others
    io.to(serverId).emit("updateUsers", servers[serverId].users);
    io.to(serverId).emit("message", { user: "System", msg: `${user} joined the chat!` });
  });

  // Handle message sending
  socket.on("message", ({ serverId, user, msg }) => {
    if (!servers[serverId]) return;
    const message = { user, msg };
    servers[serverId].messages.push(message);
    io.to(serverId).emit("message", message);
  });

  // Typing indicators
  socket.on("typing", ({ serverId, user }) => {
    socket.to(serverId).emit("typing", { user });
  });

  socket.on("stopTyping", ({ serverId, user }) => {
    socket.to(serverId).emit("stopTyping", { user });
  });

  // When user disconnects
  socket.on("disconnect", () => {
    const serverId = socket.serverId;
    const user = socket.username;

    if (serverId && servers[serverId]) {
      servers[serverId].users = servers[serverId].users.filter((u) => u !== user);
      io.to(serverId).emit("updateUsers", servers[serverId].users);
      io.to(serverId).emit("message", { user: "System", msg: `${user} left the chat.` });
    }

    console.log("🔴 User disconnected");
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
