import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    storeName: { type: String, default: "" },
    store_name: { type: String, default: "" },
    storeSlug: { type: String, default: "", index: true },
    store_slug: { type: String, default: "", index: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    code: { type: String, default: "" },
    type: { type: String, default: "Coupon" },
    status: { type: String, default: "Active" },
    expiryDate: { type: String, default: "" },
    expiry_date: { type: String, default: "" },
    affiliateLink: { type: String, default: "" },
    affiliate_link: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    cta_label: { type: String, default: "" },
    countryCode: { type: String, default: "GLOBAL" },
    position: { type: Number, default: 0 },
    autoRenew: { type: Boolean, default: false },
    auto_renew: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
