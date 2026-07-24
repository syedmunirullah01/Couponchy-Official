import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    category: { type: String, default: "Latest Data" },
    author: { type: String, default: "Admin" },
    author_role: { type: String, default: "Editor" },
    status: { type: String, default: "published" },
    display_date: { type: String, default: "" },
    read_time: { type: String, default: "" },
    thumbnail_type: { type: String, default: "wave" },
    featured: { type: Boolean, default: false },
    country_code: { type: String, default: "GLOBAL" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
