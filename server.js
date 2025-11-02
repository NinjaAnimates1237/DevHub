 // server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("setName", (name) => {
    socket.username = name;
    io.emit("chat message", { user: "System", text: `${name} joined DevHub!` });
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", { user: socket.username, text: msg });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("chat message", { user: "System", text: `${socket.username} left DevHub.` });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🌐 DevHub running on http://localhost:${PORT}`));
