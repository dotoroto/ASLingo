import { connectToDatabase } from "../models/db.js";
import User from "../models/User.js";

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === "GET") {
    const users = await User.find();
    return res.json(users);
  }

  return res.status(405).send("Method not allowed");
}
