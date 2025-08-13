const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/messages/send
router.post('/send', auth, async (req, res) => {
  const {recipientId, content} = req.body
  const senderId = req.user.id;

  if (!content) {
    return res.status(400).json({message: "Message content is required"});
  }

  const sender = await User.findById(senderId);
  if (!sender.matches.includes(recipientId)) {
    return res.status(403).json({message: "You can only message matched users"});
  }

  const newMessage = new Message({
    sender: senderId,
    recipient: recipientId,
    content,
  });

  await newMessage.save();
  res.status(201).json(newMessage);
});

//GET /api/messages/conversation/:userId
router.get('/conversation/:userId', auth, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.userId
  
  const currentUser = await User.findById(userId);
  if (!currentUser.matches.includes(otherUserId)) {
    return res.status(403).json({message: "You are not matched with this user"});
  }
  //retrieve all message between the two users, regardless of who sent it
  //$or: looks for message in either direction
  const message = await Message.find({
    $or: [
      {sender: userId, recipient: otherUserId},
      {sender: otherUserId, recipient: userId}
    ]
  }).sort('createdAt');

  //fetch user's name
  const otherUser = await User.findById(otherUserId).select("name");
  //send the list of messages between the two users
  res.json({
    userName: otherUser?.name || "Unknown",
    message
  });
});

module.exports = router;

