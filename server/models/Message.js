import mongoose from 'mongoose';
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    senderClerkId: {
      type: String,
      required: true,
    },
    recipientClerkId: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: true,
    },
    roomId: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;