import mongoose from "mongoose";

const TranslationSchema = new mongoose.Schema(
  {
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: String, required: true, index: true },
    field_key: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true },
    translated_text: { type: String, default: "" },
    original_hash: { type: String, default: "" },
  },
  { timestamps: false, strict: false }
);

TranslationSchema.index({ entity_type: 1, entity_id: 1, language: 1, field_key: 1 }, { unique: true });

export default mongoose.models.Translation || mongoose.model("Translation", TranslationSchema);
