const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const port = process.env.PORT || 3000;

// Enable test mode (set to true to bypass time restriction)
const TEST_MODE = true;

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
  return TEST_MODE || (hour >= 1 && hour < 5);
}

io.on('connection', (socket) => {
  const username = generateUsername();
  users.add(username);

  socket.emit('set username', username);

  if (!isNightTime()) {
    socket.emit('error', 'Chat is only open from 1 AM to 5 AM');
  }

  socket.on('chat message', (msg) => {
    if (isNightTime()) {
      io.emit('chat message', { username, message: msg });
    } else {
      socket.emit('error', 'Chat is only open from 1 AM to 5 AM');
    }
  });

  socket.on('disconnect', () => {
    users.delete(username);
  });
});

http.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Test mode: ${TEST_MODE ? 'Enabled' : 'Disabled'}`);
});