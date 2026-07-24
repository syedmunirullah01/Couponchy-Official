import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
