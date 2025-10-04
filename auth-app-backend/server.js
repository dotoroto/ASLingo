import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DOMAIN = process.env.AUTH0_DOMAIN;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const CONNECTION = process.env.AUTH0_DB_CONNECTION;

// Connect to Mongo
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Mongo connected"))
.catch(err => console.error("Mongo connection error:", err));

// -------- Signup --------
app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Auth0 signup
    const auth0Res = await axios.post(`https://${DOMAIN}/dbconnections/signup`, {
      client_id: CLIENT_ID,
      email,
      password,
      connection: CONNECTION
    });

    // Check if user exists in Mongo
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name: name || "",
        xp: 0,
      });
      await user.save();
      console.log("New user saved with XP:", user.toObject());
    }

    res.json({ message: "Signup successful", data: auth0Res.data, user });
  } catch (err) {
    console.error("Signup error:", err.response?.data || err);
    res.status(err.response?.status || 500)
       .json(err.response?.data || { error: "Signup failed" });
  }
});

// -------- Login --------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const auth0Res = await axios.post(`https://${DOMAIN}/oauth/token`, {
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: email,
      password,
      realm: CONNECTION,
      scope: "openid profile email"
    });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: "" ,  xp: 0,});
      await user.save();
    }

    res.json({
      tokenData: auth0Res.data,
      user: { email: user.email, xp: user.xp, name: user.name }
    });
  } catch (err) {
    console.error("Login error full:", err.response?.data || err);
    res.status(err.response?.status || 500)
       .json(err.response?.data || { error: "Login failed" });
  }
});

// -------- Get User --------
app.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------- Add XP --------
app.post("/user/:email/add-xp", async (req, res) => {
  const { email } = req.params;
  const { amount } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { xp: amount } },
      { new: true, runValidators: true } // ensures xp updates properly
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ xp: user.xp });
  } catch (err) {
    res.status(500).json({ error: "Could not update XP" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
