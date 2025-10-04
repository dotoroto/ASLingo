// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  xp: { type: Number, default: 0, required: true } // ✅ required & default
});

export default mongoose.model("User", userSchema);
