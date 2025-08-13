//authRoutes is a dedicated Express router that handles all authentication-related HTTP endpoints for your app
const express = require("express");
const router = express.Router();
const User = require("../models/User")

//import the register/login function from your authController file
//this function contains the logic for handling user registration
const {register, login} = require("../controllers/authController");

// import middleware to protect routes
const auth = require("../middleware/authMiddleware");

//defines a POST route at /register on this router
// when a POST request is made to /register, /login, express runs the controller function
router.post("/register", register);
router.post("/login", login);

// protected route -- get current user's profile
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

module.exports = router;