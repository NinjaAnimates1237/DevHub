// DevHub 2.2 — Working servers, messaging, and typing indicator
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

let servers = {
  global: { name: "Global Chat", users: {}, messages: [] },
};

// Create new server endpoint
app.post("/create-server", (req, res) => {
  const { name } = req.body;
  const id = Math.random().toString(36).substring(2, 8);
  servers[id] = { name, users: {}, messages: [] };
  console.log(`✅ Created server: ${name} (${id})`);
  res.json({ id });
});

// Socket.io setup
io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);
  let currentServer = "global";
  let username = "Anonymous";

  // Join server
  socket.on("joinServer", ({ serverId, user }) => {
    if (!servers[serverId]) servers[serverId] = { name: "Untitled", users: {}, messages: [] };

    // Leave old server first
    socket.leave(currentServer);
    currentServer = serverId;
    username = user;

    socket.join(serverId);
    servers[serverId].users[socket.id] = username;

    io.to(serverId).emit("updateUsers", Object.values(servers[serverId].users));
    socket.emit("chatHistory", servers[serverId].messages);

    io.to(serverId).emit("message", {
      user: "System",
      text: `${username} joined the chat.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  });

  // Handle chat messages
  socket.on("chatMessage", (msg) => {
    const message = {
      user: username,
      text: msg,
      timestamp: new Date().toLocaleTimeString(),
    };
    servers[currentServer].messages.push(message);
    io.to(currentServer).emit("message", message);
  });

  // Typing indicator
  socket.on("typing", (isTyping) => {
    socket.to(currentServer).emit("userTyping", { user: username, isTyping });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (servers[currentServer]) {
      delete servers[currentServer].users[socket.id];
      io.to(currentServer).emit("updateUsers", Object.values(servers[currentServer].users));
      io.to(currentServer).emit("message", {
        user: "System",
        text: `${username} left the chat.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    console.log("🔴 Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ DevHub running on port ${PORT}`));
