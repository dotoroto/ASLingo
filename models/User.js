import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  xp: { type: Number, default: 0 },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
