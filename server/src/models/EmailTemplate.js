import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    subject: { type: String, required: true, trim: true, maxlength: 240 },
    htmlBody: { type: String, required: true, maxlength: 10000000 },
    placeholders: { type: [String], default: [] },
    thumbnailKey: { type: String, default: "", trim: true, maxlength: 80 },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    // Defaults to "custom" (not e.g. "newsletter") so existing/manually-uploaded
    // templates aren't mislabeled by the new AI-generator categories.
    type: {
      type: String,
      enum: ["newsletter", "event_announcement", "promotional", "transactional", "welcome_email", "custom"],
      default: "custom",
    },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "active", "archived"], default: "active" },
    aiGenerated: { type: Boolean, default: false },
    aiPrompt: { type: String, default: "", trim: true, maxlength: 4000 },
    colorScheme: { type: String, enum: ["default", "dark", "light", "brand"], default: "default" },
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "email_templates" }
);

emailTemplateSchema.index({ createdAt: -1 });

const EmailTemplate =
  mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", emailTemplateSchema);

export default EmailTemplate;
