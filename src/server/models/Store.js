import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    category: { type: String, default: "" },
    categorySlug: { type: String, default: "", index: true },
    logoImage: { type: String, default: "" },
    logoText: { type: String, default: "" },
    heroImage: { type: String, default: "" },
    trustStatus: { type: String, default: "verified" },
    affiliateLink: { type: String, default: "" },
    countryCode: { type: String, default: "GLOBAL", index: true },
    description: { type: String, default: "" },
    aboutText: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    contentIntroTitle: { type: String, default: "" },
    contentIntroParagraph1: { type: String, default: "" },
    contentIntroParagraph2: { type: String, default: "" },
    contentWhyItemsText: { type: String, default: "" },
    contentOutro: { type: String, default: "" },
    faq1Question: { type: String, default: "" },
    faq1Answer: { type: String, default: "" },
    faq2Question: { type: String, default: "" },
    faq2Answer: { type: String, default: "" },
    faq3Question: { type: String, default: "" },
    faq3Answer: { type: String, default: "" },
    faq4Question: { type: String, default: "" },
    faq4Answer: { type: String, default: "" },
    faq5Question: { type: String, default: "" },
    faq5Answer: { type: String, default: "" },
    offersCount: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
