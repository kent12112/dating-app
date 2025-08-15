import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true }, // store Clerk user ID
  email: { type: String, required: true, unique: true },
  name: String,
  location: String,
  height: String,
  age: Number,
  gender: String,
  nationality: String,
  languages: [String],
  lookingFor: String,
  bio: String,
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  photos: { type: [String], default: [] },
  likeSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likeReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;