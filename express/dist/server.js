import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

// CORS configuration to allow requests from frontend
app.use(cors({
  origin: 'https://aslingo.study',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI("AIzaSyBzIhAeIGNhaL-wqm3uDBNqdgdV_Iiy9ss");



// ---------- Feedback Endpoint ----------
app.post("/api/feedback", async (req, res) => {
  const { target, results } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const prompt = `
  The user attempted the ASL gesture for "${target}".
  Detected results: ${results}.
  Give friendly, constructive feedback in 2–3 bullet points on how they can make their gestures look more like ${target} than ${results}.
  `;

  try {
    const result = await model.generateContent(prompt);
    const feedback = result.response.text();
    res.json({ feedback });
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).send("Error generating feedback");
  }
});


/*const DOMAIN = process.env.AUTH0_DOMAIN;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const CONNECTION = process.env.AUTH0_DB_CONNECTION;*/

// Connect to Mongo

// -------- Signup --------
app.post("/api/signup", async (req, res) => {
  await mongoose.connect("mongodb+srv://DorothyZheng:thisisasupercoolpassword@cluster0.uivinb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const { email, password, name } = req.body;

  try {
    // Auth0 signup
    const auth0Res = await axios.post(`https://dev-0rs44np0zj70rnwz.us.auth0.com/dbconnections/signup`, {
      client_id: "oSvrqa2TRwe4SBy58IehjFQbHfuMDTEE",
      email,
      password,
      connection: "Username-Password-Authentication"
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
  await mongoose.connect("mongodb+srv://DorothyZheng:thisisasupercoolpassword@cluster0.uivinb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const { email, password } = req.body;

  try {
    const auth0Res = await axios.post(`https://dev-0rs44np0zj70rnwz.us.auth0.com/oauth/token`, {
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      client_id: "oSvrqa2TRwe4SBy58IehjFQbHfuMDTEE",
      client_secret: "oYH1kmaehD3iszxayzFl-aWBSjXrCG7edGr-dr9CfiQrPzkLQ7SWFIk5UzmNLtoX",
      username: email,
      password,
      realm: "Username-Password-Authentication",
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
    res.status(err || 500)
       .json(err || { error: "Login failed" });
  }
});

// -------- Get User --------
app.get("/api/user/:email", async (req, res) => {
  await mongoose.connect("mongodb+srv://DorothyZheng:thisisasupercoolpassword@cluster0.uivinb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  await mongoose.connect("mongodb+srv://DorothyZheng:thisisasupercoolpassword@cluster0.uivinb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const users = await User.find();
  res.json(users);
});


// -------- Add XP --------
app.post("/api/user/:email/add-xp", async (req, res) => {
  await mongoose.connect("mongodb+srv://DorothyZheng:thisisasupercoolpassword@cluster0.uivinb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
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

export { app };
//app.listen(5000, () => console.log("Server running on port 5000"));
