import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, index: true },
    password: { type: String, required: true },
    name: { type: String, default: "" },
    role: { type: String, default: "editor" },
    permissions: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
