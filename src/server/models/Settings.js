import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
