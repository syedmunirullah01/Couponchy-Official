import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    storeSlug: { type: String, required: true, index: true },
    storeName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    currency: { type: String, default: "$" },
    ctaLabel: { type: String, default: "View Product" },
    productUrl: { type: String, default: "" },
    status: { type: String, default: "Active" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
