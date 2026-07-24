import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    status: { type: String, default: "enabled" },
    shortDescription: { type: String, default: "" },
    longDescription: { type: String, default: "" },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
