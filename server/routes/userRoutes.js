//express.Router(): creates a mini router to define routes related to user profiles
//User: MongoDB model from models/user.js
//auth: midddleware that checks the HWT and set req.user with the decoded user ID
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Message = require("../models/Message");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

//GET current user profile
//req.user.id: is set by the JWT middleware
router.get("/profile", auth, async (req, res) => {
  try {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
  } catch (err) {
    res.status(500).json({msg: "Failed to get user profile"});
  }
});

//UPDATE user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const fieldsToUpdate = {
      age: req.body.age,
      gender: req.body.gender,
      nationality: req.body.nationality,
      languages: req.body.languages,
      lookingFor: req.body.lookingFor,
      bio: req.body.bio,
      photoUrl: req.body.photoUrl,
    };
    //{new: true}: makes mongoose return the updated document
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {new: true}
    ).select("-password");

    res.json(user)
  } catch (err){
    res.status(500).json({msg: "Failed to update user profile"});
  }
});

//GET all other users
router.get("/all", auth, async (req, res) => {
  try {
    currentUser = await User.findById(req.user.id).select("likeSent likeReceived matches");

    //exclusin list
    const excludeIds = [
      req.user.id,
      ...currentUser.likeSent,
      ...currentUser.likeReceived,
      ...currentUser.matches,
    ];

    //fetch users not in the exclusion list
    const users = await User.find({
      _id: {$nin: excludeIds}
    }).select("-password");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({msg: "Failed to fetch users"});
  }
})

// POST /api/user/upload
//upload.array("photos", 6): allows uploading up to 6 images
const fs = require("fs");
const path = require("path");
router.post("/upload", auth, upload.array("photos", 6), async (req, res) => {
  try {
    //find the user first to get current photos count
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({msg: "User not found"});
    
    const currentPhotosCount = user.photos.length;
    const newPhotosCount = req.files.length;

    if (currentPhotosCount + newPhotosCount > 6) {
      //delete uploaded files
      req.files.forEach(file => {
        fs.unlink(path.join(__dirname, "..", "uploads", file.filename), err => {
          if (err) console.error("Failed to delete file:", file.filename, err);
        });
      });

      return res.status(400).json({
        msg: `Photo upload limit exceeded. You already have ${currentPhotosCount} photos. Max is 6.`,
      });
    }
    //get the file paths
    //req.files: an array of files uploaded by the user
    //for each, we extract the filename and build a public path like
    // /uploads/myhoto-1720000.jpg
    const photoPaths = req.files.map(file => `/uploads/${file.filename}`);

    //save the file paths to the user's profile in mongoDB
    //req.user.id: comes from auth middleware
    //this updates the photos field in that user's document
    user.photos.push(...photoPaths);
    await user.save();

    res.json({msg: "Photos uploaded successfully", photos: user.photos});
  } catch (err) {
    console.error(err);
    res.status(500).json({msg: "Failed to upload photos"});
  }
})

//DELETE /api/user/photo
router.delete("/photo", auth, async (req, res) => {
  const userId = req.user.id;
  const {photoPath} = req.body;

  if (!photoPath) {
    return res.status(400).json({msg: "Photo path is required"});
  }
  try {
    //1. remove photo from user's photos array
    const user = await User.findById(userId);
    if (!user.photos.includes(photoPath)){
      return res.status(404).json({msg: "Photo not found in your profile"});
    }

    user.photos = user.photos.filter((p) => p != photoPath);
    await user.save();

    //2. delete the photo file from disk
    const absolutePath = path.join(__dirname, "..", photoPath); // safe path
    fs.unlink(absolutePath, (err) => {
      if (err) {
        console.error("Failed to delete file:", err);
        // Don't block the response; photo is removed from DB at least
      }
    });

    return res.json({ msg: "Photo deleted", photoPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({msg: "Server error"});
  }
});

// POST /like/:id
// user A likes user B
router.post('/like/:id', auth, async (req, res) => {
  const userId = req.user.id; //User A
  const targetId = req.params.id; //User B

  if (userId.toString() === targetId) {
    return res.status(400).json({message: "You can't like yourself"});
  }

  const user = await User.findById(userId);
  const targetUser = await User.findById(targetId);

  if (!targetUser) return res.status(404).json({message: "User not found"});

  //prevent duplicate like
  if (user.likeSent.includes(targetId)) {
    return res.status(400).json({message: "Already liked this user"});
  }

  //add like
  user.likeSent.push(targetId);
  targetUser.likeReceived.push(userId);

  await user.save();
  await targetUser.save();

  res.json({message: "Like sent successfully"});
})

//POST /match/:id
//User B accepts match from User A
router.post('/match/:id', auth, async (req, res) => {
  const userId = req.user.id; //User B
  const otherUserId = req.params.id; //User A

  const user = await User.findById(userId);
  const otherUser = await User.findById(otherUserId);

  if (!user.likeReceived.includes(otherUserId)) {
    return res.status(400).json({message: "No likes received from this user"})
  }

  //remove from likesReceived and likesSent
  user.likeReceived = user.likeReceived.filter(id => id.toString() !== otherUserId);
  otherUser.likeSent = otherUser.likeSent.filter(id => id.toString() !== userId);

  //Add match
  if (!user.matches.includes(otherUserId)) user.matches.push(otherUserId);
  if (!otherUser.matches.includes(userId)) otherUser.matches.push(userId);

  await user.save();
  await otherUser.save();

  res.json({message: "Match created successfully!"})
});

//GET /likes-received
// to see who liked you
router.get('/likes-received', auth, async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate('likeReceived', '_id name age photos');
  console.log(({likes: user.likeReceived}));
  res.json({likes: user.likeReceived});
})

//GET /likes-sent
router.get('/likes-sent', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('likeSent');
    res.json({likeSent: user.likeSent || []});
  } catch (err) {
    res.status(500).json({msg: "Failed to get sent likes"});
  }
})

// GET /api/user/matches
router.get('/matches', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('matches', 'name age photos')
      .select('matches');
    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    // For each match, find the latest message between the users
    const matchesWithLastMessage = await Promise.all(user.matches.map(async (match) => {
      const lastMsg = await Message.findOne({
        $or: [
          { sender: req.user.id, recipient: match._id },
          { sender: match._id, recipient: req.user.id }
        ]
      }).sort({ createdAt: -1 }).limit(1);

      return {
        ...match.toObject(),
        lastMessage: lastMsg ? lastMsg.content : null,
        lastMessageTime: lastMsg ? lastMsg.createdAt : null,
      };
    }));

    res.json(matchesWithLastMessage);
  } catch (err) {
    console.error("Error fetching matches:", err);
    res.status(500).json({ message: 'Failed to fetch matches' });
  }
});

//update user's recent location
router.post("/location", auth, async (req, res) => {
  const {latitude, longitude} = req.body;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({message: "Invalid latitude or longitude"});
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({message: "User not found"});

    user.latitude = latitude;
    user.longitude = longitude;
    await user.save();

    res.json({message: "Locaiton updated"});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
});

//get user's location
router.get("/location", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("latitude longitude");
    if (!user) return res.status(404).json({message: "User not found"});

    res.json({latitude: user.latitude, longitude: user.longitude});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
})

// GET user by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({msg: "User not found"});
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({msg: "Failed to get user"});
  }
})

module.exports = router;