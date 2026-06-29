require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Message = require('./models/Message');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:4000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Socket.IO auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Track online users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', async (socket) => {
  const userId = socket.user._id.toString();
  console.log(`User connected: ${socket.user.username} (${userId})`);

  socket.join(userId);

  // Store socket and mark user online
  onlineUsers.set(userId, socket.id);
  await User.findByIdAndUpdate(userId, { isOnline: true });

  // Broadcast online status
  io.emit('user:online', { userId, username: socket.user.username });

  // Send current online users list to the newly connected user
  socket.emit('users:online', Array.from(onlineUsers.keys()));

  // Handle private message
  socket.on('message:send', async ({ receiverId, content }) => {
    try {
      if (!receiverId || !content?.trim()) return;

      const message = await Message.create({
        sender: userId,
        receiver: receiverId,
        content: content.trim(),
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar');

      // Send to sender's other tabs as well
      io.to(userId).emit('message:new', populatedMessage);

      // Send to receiver if online
      if (onlineUsers.has(receiverId)) {
        io.to(receiverId).emit('message:new', populatedMessage);
      }
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing:start', ({ receiverId }) => {
    if (onlineUsers.has(receiverId)) {
      io.to(receiverId).emit('typing:start', {
        userId,
        username: socket.user.username,
      });
    }
  });

  socket.on('typing:stop', ({ receiverId }) => {
    if (onlineUsers.has(receiverId)) {
      io.to(receiverId).emit('typing:stop', { userId });
    }
  });

  // Handle read receipts
  socket.on('messages:read', async ({ senderId }) => {
    await Message.updateMany(
      { sender: senderId, receiver: userId, read: false },
      { read: true, readAt: new Date() }
    );
    if (onlineUsers.has(senderId)) {
      io.to(senderId).emit('messages:read', { readBy: userId });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.user.username}`);
    
    // Check if user has any other active sockets in their room
    const sockets = await io.in(userId).fetchSockets();
    
    if (sockets.length === 0) {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit('user:offline', { userId });
    } else {
      // Update onlineUsers to point to one of the remaining sockets
      onlineUsers.set(userId, sockets[0].id);
    }
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
