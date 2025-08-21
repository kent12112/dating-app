//import dependencies
import express from "express"; //lets you reate API routes and handle HTTP requests
import mongoose from "mongoose"; //connects to MongoDB and lets you define schema
import cors from "cors"; //allow requests from different origins(your frontend on a different port)
import dotenv from "dotenv"; //loads env variables from .env into process.env
import { clerkClient } from '@clerk/clerk-sdk-node';
import http from "http";
import { Server } from "socket.io";
import Message from "./models/Message.js";

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

  //SOCKET.IO SETUP
const server = http.createServer(app);
const io = new Server(server, {
    cors:{
      origin: "*", // replace with your frontend URL in production
      methods: ["GET", "POST"]
    }
  })
app.set("io", io);

//set up routes
import userRoutes from "./routes/userRoutes.js";
app.use("/api/user", userRoutes);
import messageRoute from "./routes/messageRoute.js";
app.use('/api/messages', messageRoute);
import webhookRoutes from "./routes/webhooks.js";
app.use("/api/webhooks", webhookRoutes);
//this connects your auth-related routes to the path /api/auth
//Eg. POST /api/auth/register will hit your register controller function
app.use("/uploads", express.static('uploads'))

//DB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("Connected to MongoDB");

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinRoom", async (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });

}).catch(err => console.log(err));


//Then works only after successful connections
//otherwise, it goes down to catch and print error