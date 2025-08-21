import express from "express";
import User from "../models/User.js";
import Message from "../models/Message.js";

const router = express.Router();

router.post("/clerk-webhook", async (req, res) => {
  console.log("Webhook hit!", req.body); // <-- DEBUG
  try {
    const event = req.body;

    if (event.type === "user.deleted") {
      const clerkId = event.data.id;

      // Find the user in MongoDB
      const user = await User.findOne({ clerkId });
      if (!user) {
        console.log(`User not found for Clerk ID: ${clerkId}`);
        return res.status(404).send("User not found");
      }

      const mongoUserId = user._id;

      // Delete all messages sent or received by this user
      await Message.deleteMany({ $or: [{ senderId: mongoUserId }, { receiverId: mongoUserId }] });

      // Delete the user
      await User.deleteOne({ _id: mongoUserId });

      console.log(`Deleted user and messages for Clerk ID: ${clerkId}`);
    }

    res.status(200).send("Webhook processed");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Error processing webhook");
  }
});

export default router;
