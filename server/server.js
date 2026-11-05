const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = {}; // socketId -> user info
let registeredUsers = [];
let messages = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('user_join', (userData) => {
    users[socket.id] = { ...userData, socketId: socket.id, status: 'online' };
    if (!registeredUsers.some(u => u.username === userData.username)) {
      registeredUsers.push(userData);
    }
    io.emit('presence_update', Object.values(users));
    io.emit('directory_update', registeredUsers);
    socket.emit('message_history', messages);
  });

  socket.on('send_message', (msg) => {
    const fullMsg = {
      ...msg,
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    };
    messages.push(fullMsg);
    io.emit('receive_message', fullMsg);
  });

  socket.on('mark_read', ({ messageId }) => {
    const m = messages.find(msg => msg.id === messageId);
    if (m) {
      m.status = 'read';
      io.emit('message_read', { messageId, status: 'read' });
    }
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      delete users[socket.id];
      io.emit('presence_update', Object.values(users));
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Realtime server listening on port ${PORT}`);
});
