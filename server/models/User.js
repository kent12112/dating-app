const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  age: Number,
  gender: String,
  nationality: String,
  languages: [String],
  lookingFor: String,
  bio: String,
  latitude: {type: Number, default: null},
  longitude: {type: Number, default: null},
  photos: {
    type: [String],
    default: []
  },
  likeSent: [{type: mongoose.Schema.Types.ObjectId, ref:"User"}],
  likeReceived: [{type: mongoose.Schema.Types.ObjectId, ref:"User"}],
  matches: [{type: mongoose.Schema.Types.ObjectId, ref:"User"}]
}, {timestamps: true});

module.exports = mongoose.model("User", userSchema);