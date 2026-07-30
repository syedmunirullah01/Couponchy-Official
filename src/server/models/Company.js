import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
  },
  { _id: false, timestamps: false, strict: false }
);

export default mongoose.models.Company || mongoose.model("Company", CompanySchema);
