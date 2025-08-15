import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const router = express.Router();

// POST /api/messages/send
router.post('/send', ClerkExpressRequireAuth(), async (req, res) => {
  const { recipientId, content } = req.body;
  const senderClerkId = req.auth.userId;

  if (!content) {
    return res.status(400).json({ message: "Message content is required" });
  }

  try {
    const sender = await User.findOne({ clerkId: senderClerkId });
    const recipient = await User.findById(recipientId);

    if (!sender) return res.status(404).json({ message: "Sender not found" });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    if (!sender.matches.map(id => id.toString()).includes(recipient._id.toString())) {
      return res.status(403).json({ message: "You can only message matched users" });
    }

    const newMessage = new Message({
      senderClerkId: sender.clerkId,
      recipientClerkId: recipient.clerkId,
      content,
      roomId: [sender._id, recipientId].sort().join("_"),
    });

    const savedMessage = await newMessage.save();

    // emit message to socket after successful save
    const io = req.app.get('io');
    if (io) {
      const roomId = [sender._id, recipientId].sort().join("_");
      io.to(roomId).emit("receiveMessage", savedMessage);
      console.log("---------");
      console.log(roomId);
      console.log("---------");
      
    }
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});


//GET /api/messages/conversation/:userId
router.get('/conversation/:userId', ClerkExpressRequireAuth(), async (req, res) => {
  const currentUserClerkId = req.auth.userId;
  const otherUserId = req.params.userId;

  const currentUser = await User.findOne({ clerkId: currentUserClerkId });
  const otherUser = await User.findById(otherUserId).select("clerkId name");

  if (!currentUser || !otherUser) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!currentUser.matches.map(id => id.toString()).includes(otherUser._id.toString())) {
    return res.status(403).json({ message: "You are not matched with this user" });
  }

  const messages = await Message.find({
    $or: [
      { senderClerkId: currentUser.clerkId, recipientClerkId: otherUser.clerkId },
      { senderClerkId: otherUser.clerkId, recipientClerkId: currentUser.clerkId }
    ]
  }).sort('createdAt');

  res.json({
    userName: otherUser.name,
    messages: messages || []  
  });
});

export default router;

