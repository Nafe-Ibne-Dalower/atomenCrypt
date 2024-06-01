const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(bodyParser.json());

// Manually set CORS headers for HTTP requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// For Keeping Render Awake...
function hitRoutePeriodically(routeUrl) {
  const target = routeUrl || 'YOUR_ROUTE_URL';
  setInterval(() => {
    fetch(target).catch((error) => console.error(`${target}: ${error.message}`));
  }, 300000);
}

// Usage: Call the function with your desired route URL
hitRoutePeriodically(process.env.WEB_URI);

// Database connection
const dbURI = process.env.MONGO_URI; 
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err));

// Define a message schema and model
const messageSchema = new mongoose.Schema({
  username: String,
  timestamp: String,
  content: String
});

const Message = mongoose.model('Message', messageSchema);

const PORT = process.env.PORT || 4000;

io.on('connection', (socket) => {
  console.log('A client connected');

  // Fetch and emit previous messages whenever a new client connects
  Message.find()
    .then(messages => {
      console.log('Fetched messages from DB:', messages);
      socket.emit('previousMessages', messages);
    })
    .catch(err => console.log(err));

  socket.on('message', (data) => {
    console.log('Received message:', data);
    
    const { username, timestamp, content } = data;

    const message = new Message({ username, timestamp, content });
    message.save()
      .then(() => {
        io.emit('message', data);
      })
      .catch(err => console.log(err));
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
