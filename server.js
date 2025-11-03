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

const servers = {}; // { code: [socket.id, ...] }

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // When user joins a server
  socket.on("joinServer", ({ username, code }) => {
    if (!servers[code]) servers[code] = [];
    servers[code].push(socket.id);
    socket.join(code);
    socket.data.username = username;
    socket.data.serverCode = code;
    io.to(code).emit("chatMessage", {
      system: true,
      text: `${username} joined the server.`,
    });
  });

  // Chat message
  socket.on("chatMessage", (msg) => {
    const username = socket.data.username || "Guest";
    const code = socket.data.serverCode;
    if (!code) return;
    io.to(code).emit("chatMessage", { username, text: msg });
  });

  socket.on("disconnect", () => {
    const username = socket.data.username;
    const code = socket.data.serverCode;
    if (code && username) {
      io.to(code).emit("chatMessage", {
        system: true,
        text: `${username} left the server.`,
      });
    }
    console.log("🔴 Disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
