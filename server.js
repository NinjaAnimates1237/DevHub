// DevHub 2.1 — Server + Online Users + Typing Indicator
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
  "global": { name: "Global Chat", users: {}, messages: [] }
};

// Create a new server (room)
app.post("/create-server", (req, res) => {
  const { name } = req.body;
  const id = Math.random().toString(36).substring(2, 8);
  servers[id] = { name, users: {}, messages: [] };
  res.json({ id });
});

io.on("connection", (socket) => {
  let currentServer = "global";
  let username = "Anonymous";

  // Join server
  socket.on("joinServer", ({ serverId, user }) => {
    if (!servers[serverId]) servers[serverId] = { name: "Untitled", users: {}, messages: [] };
    currentServer = serverId;
    username = user;

    socket.join(serverId);
    servers[serverId].users[socket.id] = username;

    // Update user list
    io.to(serverId).emit("updateUsers", Object.values(servers[serverId].users));

    // Send chat history
    socket.emit("chatHistory", servers[serverId].messages);

    // Announce join
    io.to(serverId).emit("message", {
      user: "System",
      text: `${username} joined the chat.`,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // Handle message send
  socket.on("chatMessage", (msg) => {
    const message = {
      user: username,
      text: msg,
      timestamp: new Date().toLocaleTimeString()
    };
    servers[currentServer].messages.push(message);
    io.to(currentServer).emit("message", message);
  });

  // Typing indicator
  socket.on("typing", (isTyping) => {
    socket.to(currentServer).emit("userTyping", { user: username, isTyping });
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (servers[currentServer]) {
      delete servers[currentServer].users[socket.id];
      io.to(currentServer).emit("updateUsers", Object.values(servers[currentServer].users));
      io.to(currentServer).emit("message", {
        user: "System",
        text: `${username} left the chat.`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
