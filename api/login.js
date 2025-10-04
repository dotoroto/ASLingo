import axios from "axios";
import { connectToDatabase } from "../models/db.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const { email, password } = req.body;

  try {
    await connectToDatabase();

    const auth0Res = await axios.post(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      username: email,
      password,
      realm: process.env.AUTH0_DB_CONNECTION,
      scope: "openid profile email",
    });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: "", xp: 0 });
      await user.save();
    }

    res.json({ tokenData: auth0Res.data, user: { email: user.email, xp: user.xp, name: user.name } });
  } catch (err) {
    console.error("Login error:", err.response?.data || err);
    res.status(err.response?.status || 500).json(err.response?.data || { error: "Login failed" });
  }
}
