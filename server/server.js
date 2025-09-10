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

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://ocha-dating-jp.vercel.app",
  "https://dating-app-ocha-fvpcac766-kentos-projects-0.vercel.app"
];

// Handle preflight OPTIONS requests first
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// CORS middleware for actual requests
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // allow Postman or mobile apps
    if(!allowedOrigins.includes(origin)) {
      return callback(new Error("CORS policy does not allow this origin"), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));


//Middleware are functions that run before your route handler
//cors(): allows request from your frontend
//express.json(): allows your server to read JSON request bodies

  //SOCKET.IO SETUP
const server = http.createServer(app);
const io = new Server(server, {
  cors:{
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})
app.set("io", io);

app.options("*", cors()); 

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