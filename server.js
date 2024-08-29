const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const port = process.env.PORT || 3000;

// Configuration
const config = {
    TEST_MODE: false,
    CHAT_OPEN_HOUR: 2,  // 2 AM
    CHAT_CLOSE_HOUR: 5, // 5 AM
};

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const users = new Set();

function generateUsername() {
  return 'Owl' + Math.floor(Math.random() * 1000);
}

function isNightTime() {
  const now = new Date();
  const hour = now.getHours();
  return config.TEST_MODE || (hour >= config.CHAT_OPEN_HOUR && hour < config.CHAT_CLOSE_HOUR);
}

function checkChatStatus() {
  const isOpen = isNightTime();
  io.emit('chat status', isOpen);
}

io.on('connection', (socket) => {
  const username = generateUsername();
  users.add(username);

  socket.emit('set username', username);
  socket.emit('chat status', isNightTime());
  socket.emit('chat config', {
    openHour: config.CHAT_OPEN_HOUR,
    closeHour: config.CHAT_CLOSE_HOUR
  });

  socket.on('chat message', (msg) => {
    if (isNightTime()) {
      io.emit('chat message', { username, message: msg });
    } else {
      socket.emit('error', `Chat is only open from ${config.CHAT_OPEN_HOUR}AM to ${config.CHAT_CLOSE_HOUR}AM`);
    }
  });

  socket.on('disconnect', () => {
    users.delete(username);
  });
});

http.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Test mode: ${config.TEST_MODE ? 'Enabled' : 'Disabled'}`);
  console.log(`Chat hours: ${config.CHAT_OPEN_HOUR}AM to ${config.CHAT_CLOSE_HOUR}AM`);
});

// Check chat status every minute
setInterval(checkChatStatus, 60000);