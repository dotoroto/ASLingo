import express from "express";
import path from "path";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Mongo connected"))
.catch(err => console.error("❌ Mongo error:", err));

// --- Serve frontend static files ---
app.use(express.static(path.join(process.cwd(), "dist")));

// --- API Routes ---
// Signup
app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const auth0Res = await axios.post(`https://${process.env.AUTH0_DOMAIN}/dbconnections/signup`, {
      client_id: process.env.AUTH0_CLIENT_ID,
      email,
      password,
      connection: process.env.AUTH0_DB_CONNECTION
    });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: name || "", xp: 0 });
      await user.save();
    }

    res.json({ message: "Signup successful", data: auth0Res.data, user });
  } catch (err) {
    console.error("Signup error:", err.response?.data || err);
    res.status(err.response?.status || 500).json(err.response?.data || { error: "Signup failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const auth0Res = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      username: email,
      password,
      realm: process.env.AUTH0_DB_CONNECTION,
      scope: "openid profile email"
    });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: "", xp: 0 });
      await user.save();
    }

    res.json({
      tokenData: auth0Res.data,
      user: { email: user.email, xp: user.xp, name: user.name }
    });
  } catch (err) {
    console.error("Login error:", err.response?.data || err);
    res.status(err.response?.status || 500).json(err.response?.data || { error: "Login failed" });
  }
});

// Get user
app.get("/api/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Add XP
app.post("/api/user/:email/add-xp", async (req, res) => {
  const { email } = req.params;
  const { amount } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { xp: amount } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ xp: user.xp });
  } catch (err) {
    res.status(500).json({ error: "Could not update XP" });
  }
});

// Gemini API
app.post("/api/gemini", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  try {
    const geminiRes = await axios.post(
      "https://api.openai.com/v1/responses",
      { model: "gpt-5-mini", input: prompt },
      { headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}`, "Content-Type": "application/json" } }
    );

    const answer = geminiRes.data.output?.[0]?.content?.[0]?.text || "No response";
    res.json({ answer });
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Gemini request failed" });
  }
});

// Catch-all: serve React for any other route
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

// Export app for Vercel
export default app;
