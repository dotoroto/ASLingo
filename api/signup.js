import axios from "axios";
import { connectToDatabase } from "../models/db.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const { email, password, name } = req.body;

  try {
    await connectToDatabase();

    const auth0Res = await axios.post(`https://${process.env.AUTH0_DOMAIN}/dbconnections/signup`, {
      client_id: process.env.AUTH0_CLIENT_ID,
      email,
      password,
      connection: process.env.AUTH0_DB_CONNECTION,
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
}
