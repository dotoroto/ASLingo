import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const DOMAIN = process.env.AUTH0_DOMAIN; // e.g. dev-xxxx.us.auth0.com
const CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const CONNECTION = process.env.AUTH0_DB_CONNECTION; // e.g., "Username-Password-Authentication"

// -------- Signup Endpoint --------
app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Register with Auth0
    const response = await axios.post(`https://${DOMAIN}/dbconnections/signup`, {
      client_id: CLIENT_ID,
      email,
      password,
      connection: CONNECTION,
    });

    // Create local Mongo user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, xp: 0 }); // start with xp=0
      await user.save();
    }

    res.json({ message: "Signup successful", data: response.data, user });
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: "Signup failed" });
  }
});


app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Auth0 login
    const response = await axios.post(`https://${DOMAIN}/oauth/token`, {
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: email,
      password,
      realm: CONNECTION,
      scope: "openid profile email",
    });

    // Get user from Mongo
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, xp: 0 });
      await user.save();
    }

    // ✅ Return both token data and user info
    res.json({
      tokenData: response.data, // JWT, etc.
      user: {
        email: user.email,
        xp: user.xp,
        name: user.name,
      },
    });
  } catch (err) {
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Login failed" });
  }
});


app.listen(5000, () => console.log("Server running on port 5000"));


app.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//add xp
app.post("/user/:email/add-xp", async (req, res) => {
  const { email } = req.params;
  const { amount } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { xp: amount } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ xp: user.xp });
  } catch (err) {
    res.status(500).json({ error: "Could not update XP" });
  }
});
