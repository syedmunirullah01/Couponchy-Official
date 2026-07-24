import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    storeName: { type: String, default: "" },
    storeSlug: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    code: { type: String, default: "" },
    type: { type: String, default: "Deal" },
    status: { type: String, default: "Active" },
    expiryDate: { type: String, default: "" },
    affiliateLink: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    countryCode: { type: String, default: "GLOBAL", index: true },
    position: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
