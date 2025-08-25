//express.Router(): creates a mini router to define routes related to user profiles
//User: MongoDB model from models/user.js
//auth: midddleware that checks the HWT and set req.user with the decoded user ID
import express from "express";
import User from "../models/User.js";
import Message from "../models/Message.js";
import upload from "../middleware/uploadMiddleware.js";
import fs from "fs"; 
import path from "path";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"; 
import { clerkClient } from "@clerk/clerk-sdk-node";

import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST /api/user/init
router.post("/init", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    // Fetch user info from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";

    let user = await User.findOne({ clerkId });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        clerkId,
        email,
        name: "",
        age: null,
        gender: "temp", //temporary default
        orientation: ["temp"], //temporary default
        nationality: "",
        languages: [],
        lookingFor: "",
        bio: "",
        locationName: "",
        location: {
          type: "Point",
          coordinates: [0, 0]
        },
        photos: [],
        likeSent: [],
        likeReceived: [],
        matches: []
      });
      await user.save();
    }

    res.json({user, isNewUser});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to initialize user" });
  }
});

// GET /api/user/me
router.get("/me", ClerkExpressRequireAuth(), async (req, res) => {
  const clerkId = req.auth.userId;
  const user = await User.findOne({ clerkId });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ mongoId: user._id, name: user.name });
});

//GET current user profile
//req.user.id: is set by the JWT middleware
router.get("/profile", ClerkExpressRequireAuth(), async (req, res) => {
  try {
  const user = await User.findOne({ clerkId: req.auth.userId }).select("-password");
  res.json(user);
  } catch (err) {
    res.status(500).json({msg: "Failed to get user profile"});
  }
});

//UPDATE user profile
router.put("/profile", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      orientation: req.body.orientation,
      nationality: req.body.nationality,
      languages: req.body.languages,
      locationName: req.body.locationName,
      height: req.body.height,
      lookingFor: req.body.lookingFor,
      bio: req.body.bio,
    };
    //{new: true}: makes mongoose return the updated document
    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      fieldsToUpdate,
      {new: true}
    ).select("-password");

    res.json(user)
  } catch (err){
    res.status(500).json({msg: "Failed to update user profile"});
  }
});

//GET all other users (NEAREST 100)
router.get("/all", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).select("likeSent likeReceived matches gender orientation location");

    if (!currentUser) {
      return res.status(404).json({ msg: "Current user not found" });
    }

    const lng = parseFloat(req.query.longitude) || currentUser.location.coordinates[0];
    const lat = parseFloat(req.query.latitude) || currentUser.location.coordinates[1];

    // Exclusion list: self, likes sent/received, matches
    const excludeIds = [
      currentUser._id,
      ...(currentUser.likeSent || []),
      ...(currentUser.likeReceived || []),
      ...(currentUser.matches || []),
    ];

    // Fetch users not in the exclusion list and gender orientation separation
    const users = await User.find({
      _id: { $nin: excludeIds },
      gender: { $in: currentUser.orientation},
      orientation: { $in: [currentUser.gender]},
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      },
    })
    .select("-password")
    .limit(100);

    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});
// POST /api/user/upload
//upload.array("photos", 6): allows uploading up to 6 images
router.post("/upload", ClerkExpressRequireAuth(), upload.array("photos", 6), async (req, res) => {
  try {
    //find the user first to get current photos count
    const user = await User.findOne({ clerkId: req.auth.userId });
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

// PUT /api/user/photos/order
router.put("/photos/order",  ClerkExpressRequireAuth(), async (req, res) => {
  const {photos} = req.body;
  if (!Array.isArray(photos)){
    return res.status(400).json({ msg: "Photos array is required" });
  }
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Ensure all photo paths exist in the current user's photos
    const allExist = photos.every((p) => user.photos.includes(p));
    if (!allExist) {
      return res.status(400).json({ msg: "Invalid photo paths in array" });
    }

    // Save new order
    user.photos = photos;
    await user.save();

    res.json({ msg: "Photo order updated", photos: user.photos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to update photo order" });
  }
});

//DELETE /api/user/photo
router.delete("/photo", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const {photoPath} = req.body;

  if (!photoPath) {
    return res.status(400).json({msg: "Photo path is required"});
  }
  try {
    //1. remove photo from user's photos array
    const user = await User.findOne({ clerkId: userId });
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
router.post('/like/:id', ClerkExpressRequireAuth(), async (req, res) => {
  const currentUser = await User.findOne({ clerkId: req.auth.userId });
  const targetUser = await User.findById(req.params.id); 

  if (!targetUser) return res.status(404).json({ message: "User not found" });
  if (currentUser._id.equals(targetUser._id)) return res.status(400).json({ message: "You can't like yourself" });

  const isMutualLike = targetUser.likeSent.some(id => id.equals(currentUser._id));

  if (isMutualLike) {
    //if that happen, just move to match
    // remove from like arrays
    targetUser.likeSent = targetUser.likeSent.filter(id => !id.equals(currentUser._id));
    currentUser.likeReceived = currentUser.likeReceived.filter(id => !id.equals(targetUser._id));

    //add to matches using $addToSet logic to avoid duplicates
    if (!currentUser.matches.some(id => id.equals(targetUser._id))) currentUser.matches.push(targetUser._id);
    if (!targetUser.matches.some(id => id.equals(currentUser._id))) targetUser.matches.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    return res.json({message: "It's a match!"});
  }
  
  //prevent duplicate like
  if (currentUser.likeSent.some(id => id.equals(targetUser._id))) return res.status(400).json({ message: "Already liked this user" }); 

  //add like
  currentUser.likeSent.push(targetUser._id); // CHANGED
  targetUser.likeReceived.push(currentUser._id);

  await currentUser.save();
  await targetUser.save();

  res.json({message: "Like sent successfully"});
})

//POST /match/:id
//User B accepts match from User A
router.post('/match/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }); 
    const otherUser = await User.findById(req.params.id);        // User A's Mongo _id from params

    // Fetch User B by Clerk ID
    if (!currentUser || !otherUser) return res.status(404).json({ message: "User not found" });

    if (!currentUser.likeReceived.some(id => id.equals(otherUser._id))) return res.status(400).json({ message: "No likes received from this user" });


    // Remove likes
    currentUser.likeReceived = currentUser.likeReceived.filter(id => !id.equals(otherUser._id));
    otherUser.likeSent = otherUser.likeSent.filter(id => !id.equals(currentUser._id));

    // Add match if not already present
    if (!currentUser.matches.some(id => id.equals(otherUser._id))) currentUser.matches.push(otherUser._id); 
    if (!otherUser.matches.some(id => id.equals(currentUser._id))) otherUser.matches.push(currentUser._id);

    await currentUser.save();
    await otherUser.save();

    res.json({ message: "Match created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET /likes-received
// to see who liked you
router.get('/likes-received', ClerkExpressRequireAuth(), async (req, res) => {
  const user = await User.findOne({ clerkId: req.auth.userId }).populate("likeReceived", "_id name age photos"); // CHANGED
  res.json({ likes: user.likeReceived });
});

//GET /likes-sent
router.get('/likes-sent', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select('likeSent');
    res.json({likeSent: user.likeSent || []});
  } catch (err) {
    res.status(500).json({msg: "Failed to get sent likes"});
  }
})

// GET /api/user/matches
router.get('/matches', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const currentUser = await User.findOne({ clerkId: req.auth.userId }).populate("matches", "name age photos");
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const userId = currentUser._id; // <-- Mongo ObjectId

    // For each match, find the latest message between the users
    const matchesWithLastMessage = await Promise.all(
      currentUser.matches.map(async (match) => {
        const lastMsg = await Message.findOne({ // CHANGED
          $or: [
            { senderId: userId, recipientId: match._id },
            { senderId: match._id, recipientId: userId }
          ]
        }).sort({ createdAt: -1 }).limit(1);
      
        const truncate = (text, maxLen = 40) => {
          if (!text) return null;
          return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
        };

        return {
          ...match.toObject(),
          lastMessage: lastMsg ? truncate(lastMsg.content) : null,
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
        };
      })
    );

    res.json(matchesWithLastMessage);
  } catch (err) {
    console.error("Error fetching matches:", err);
    res.status(500).json({ message: 'Failed to fetch matches' });
  }
});

//update user's recent location
router.post("/location", ClerkExpressRequireAuth(), async (req, res) => {
  const {latitude, longitude} = req.body;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({message: "Invalid latitude or longitude"});
  }

  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({message: "User not found"});

    user.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    }
    await user.save();
    res.json({message: "Locaiton updated"});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
});

//get user's location
router.get("/location", ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId }).select("location");
    if (!user) return res.status(404).json({message: "User not found"});

    res.json({latitude: user.location.coordinates[1], 
              longitude: user.location.coordinates[0]});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Server error"});
  }
})

// GET user by ID
router.get("/:id", ClerkExpressRequireAuth(), async (req, res) => {
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

export default router;