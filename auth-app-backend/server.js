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
const CONNECTION = process.env.AUTH0_DB_CONNECTION; // e.g., "Username-Password-Authentication"

// -------- Signup Endpoint --------
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await axios.post(`https://${DOMAIN}/dbconnections/signup`, {
      client_id: CLIENT_ID,
      email,
      password,
      connection: CONNECTION,
    });
    res.json({ message: "Signup successful", data: response.data });
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || err.message);
  }
});

// -------- Login Endpoint --------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await axios.post(`https://${DOMAIN}/oauth/token`, {
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      client_id: CLIENT_ID,
      username: email,
      password,
      realm: CONNECTION,
      scope: "openid profile email",
    });
    // Send tokens to frontend
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || err.message);
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
