const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Server is running');
});

io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('message', (data) => {
    console.log('Received message:', data);
    io.emit('message', data);
  });

  socket.on('voice_message', (audioData) => {
    console.log('Received voice message:', audioData);
    io.emit('voice_message', audioData);
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
