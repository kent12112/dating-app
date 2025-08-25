import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true }, // store Clerk user ID
  email: { type: String, required: true, unique: true },
  gender: { type: String, required: true, default: ""},
  orientation: { type: [String], required: true, default: []},
  name: String,
  locationName: String,
  height: String,
  age: Number,
  nationality: String,
  languages: [String],
  lookingFor: String,
  bio: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  photos: { type: [String], default: [] },
  likeSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likeReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

// Enable geospatial queries
userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);
export default User;