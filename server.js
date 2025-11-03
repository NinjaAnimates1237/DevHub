const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Database = require('better-sqlite3');

const db = new Database('devhub.db');

// Create tables if not exist
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS servers (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  server_id INTEGER,
  username TEXT,
  content TEXT,
  timestamp TEXT
)`).run();

app.use(express.static('public'));
app.use(express.json());

// Simple username registration
app.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send('Username required');

  try {
    db.prepare('INSERT OR IGNORE INTO users (username) VALUES (?)').run(username);
    res.send({ success: true });
  } catch (e) {
    res.status(500).send('Database error');
  }
});

// Fetch messages for a server
app.get('/messages/:serverId', (req, res) => {
  const serverId = req.params.serverId;
  const msgs = db.prepare('SELECT * FROM messages WHERE server_id = ? ORDER BY id ASC').all(serverId);
  res.send(msgs);
});

// Fetch all servers
app.get('/servers', (req, res) => {
  const servers = db.prepare('SELECT * FROM servers').all();
  res.send(servers);
});

// Add server
app.post('/servers', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Server name required');
  db.prepare('INSERT OR IGNORE INTO servers (name) VALUES (?)').run(name);
  res.send({ success: true });
});

// Socket.IO
const onlineUsers = {}; // { serverId: [usernames] }

io.on('connection', (socket) => {
  let currentServer = null;
  let currentUser = null;

  socket.on('joinServer', ({ serverId, username }) => {
    currentServer = serverId;
    currentUser = username;
    socket.join(serverId);

    if (!onlineUsers[serverId]) onlineUsers[serverId] = [];
    if (!onlineUsers[serverId].includes(username)) onlineUsers[serverId].push(username);

    io.to(serverId).emit('updateUsers', onlineUsers[serverId]);
  });

  socket.on('sendMessage', ({ serverId, username, content }) => {
    const timestamp = new Date().toLocaleTimeString();
    db.prepare('INSERT INTO messages (server_id, username, content, timestamp) VALUES (?, ?, ?, ?)')
      .run(serverId, username, content, timestamp);
    io.to(serverId).emit('newMessage', { username, content, timestamp });
  });

  socket.on('typing', () => {
    if (currentServer && currentUser) {
      socket.to(currentServer).emit('typing', currentUser);
    }
  });

  socket.on('disconnect', () => {
    if (currentServer && currentUser && onlineUsers[currentServer]) {
      onlineUsers[currentServer] = onlineUsers[currentServer].filter(u => u !== currentUser);
      io.to(currentServer).emit('updateUsers', onlineUsers[currentServer]);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
