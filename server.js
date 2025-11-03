const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // serve HTML, CSS, JS

// Track servers and users
let servers = {}; // { serverName: [username1, username2] }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-server', ({ serverName, username }) => {
    socket.join(serverName);

    if (!servers[serverName]) servers[serverName] = [];
    if (!servers[serverName].includes(username)) servers[serverName].push(username);

    // Notify server users
    io.to(serverName).emit('server-message', `${username} joined ${serverName}`);
    
    // Update everyone with server list
    io.emit('update-servers', servers);
  });

  socket.on('chat-message', ({ serverName, username, message }) => {
    io.to(serverName).emit('chat-message', { username, message });
  });

  socket.on('disconnecting', () => {
    // Remove user from all servers they were in
    for (const room of socket.rooms) {
      if (servers[room]) {
        servers[room] = servers[room].filter(u => u !== socket.id);
      }
    }
    io.emit('update-servers', servers);
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
