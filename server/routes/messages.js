const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get conversation between two users
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard: recent conversations with last message
router.get('/dashboard/conversations', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get all unique users the current user has chatted with
    const sentMessages = await Message.distinct('receiver', { sender: currentUserId });
    const receivedMessages = await Message.distinct('sender', { receiver: currentUserId });

    const allUserIds = [...new Set([
      ...sentMessages.map(id => id.toString()),
      ...receivedMessages.map(id => id.toString()),
    ])];

    // For each user, get the last message and unread count
    const conversations = await Promise.all(
      allUserIds.map(async (userId) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: userId },
            { sender: userId, receiver: currentUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .populate('sender', 'username avatar')
          .populate('receiver', 'username avatar');

        const unreadCount = await Message.countDocuments({
          sender: userId,
          receiver: currentUserId,
          read: false,
        });

        const user = await User.findById(userId).select('username email avatar isOnline lastSeen');

        return { user, lastMessage, unreadCount };
      })
    );

    // Filter out any conversations where the user was deleted, then sort by last message time
    const validConversations = conversations.filter(c => c.user != null);
    
    validConversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || 0;
      const timeB = b.lastMessage?.createdAt || 0;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({ conversations: validConversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
