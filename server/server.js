//import dependencies
const express = require("express"); //lets you reate API routes and handle HTTP requests
const mongoose = require("mongoose"); //connects to MongoDB and lets you define schema
const cors = require("cors"); //allow requests from different origins(your frontend on a different port)
const dotenv = require("dotenv") //loads env variables from .env into process.env

dotenv.config(); //load .env variables
const app = express(); //Create express app
//this prepares your backend to use the config(DB credentials, port)
//If you try to use process.env.MONGO_URI before calling dotenv.config(), it will be undefined.

//apply middleware
app.use(cors()); // enables CORS
app.use(express.json()); // parses incoming JSON requests (req.body)
//Middleware are functions that run before your route handler
//cors(): allows request from your frontend
//express.json(): allows your server to read JSON request bodies

//set up routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);
const messageRoute = require('./routes/messageRoute');
app.use('/api/messages', messageRoute);
//this connects your auth-related routes to the path /api/auth
//Eg. POST /api/auth/register will hit your register controller function
app.use("/uploads", express.static('uploads'))

//DB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB");
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch(err => console.log(err));

//Then works only after successful connections
//otherwise, it goes down to catch and print error