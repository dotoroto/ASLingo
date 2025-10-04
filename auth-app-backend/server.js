import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { expressjwt } from "express-jwt";
import jwks from "jwks-rsa";
import User from "./models/User.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Auth0 middleware
const checkJwt = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

// Public route
app.get("/", (req, res) => {
  res.send("Hello from backend 👋");
});

// Protected route
app.get("/profile", checkJwt, (req, res) => {
  res.json({
    msg: "You are authorized!",
    user: req.auth, // Auth0 user claims
  });
});


// -------------------- USER ROUTES --------------------

// Register user
app.post("/api/register", async (req, res) => {
  try {
    const { email, name } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    // Create new user
    user = new User({ email, name });
    await user.save();

    res.status(201).json({ msg: "User registered successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all users (for testing)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
