const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//async is a function that lets you work with asynchronous code using await instead of callbacks
//await pauses at each step until it finishes but doesn't freeze the whole server
exports.register = async (req, res) => {
  try {
    const {name, email, password} = req.body;

    //check if email exists
    const userExists = await User.findOne({email});
    if (userExists) return res.status(400).json({msg: "User already exists"});

    //hash password
    //a salt is a random string that is added to a password before it's hashed
    //to make each password hash unique, even if two people have the same password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create and save the user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    //create JWT token(JSON web token)
    //JWT is a secure string used to identify a user after they log in
    //it's like digital passport: once log in, the server give you a token
    //then you send that token with future requests to prove who you are-no need to log in again everytime
    const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.status(201).json({ token, user: {id: newUser._id, name: newUser.name}});
  } catch (err) {
    res.status(500).json({msg: "Server error", error: err.message});
  }

};

exports.login = async (req, res) => {
  try {
    const {email, password} = req.body;

    //find user
    const user = await User.findOne({email});
    if (!user) return res.status(400).json({msg: "Invalid credentials"});

    //check password
    // password: the plain password the user just entered
    // user.password: the hashed + salted password saved in the DB
    // but bcrypt remove hash and salt from user.password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(400).json({msg: "Invalid credentials"});

    //create token
    //same as register
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    //send a JSON response contatining:
    // the token and the basic user info
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({msg: "Server error", error: err.message});
  }
};