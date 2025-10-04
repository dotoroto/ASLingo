import { connectToDatabase } from "../models/db.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const { email, amount } = req.body;

  await connectToDatabase();

  try {
    const user = await User.findOneAndUpdate({ email }, { $inc: { xp: amount } }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ xp: user.xp });
  } catch (err) {
    res.status(500).json({ error: "Could not update XP" });
  }
}
