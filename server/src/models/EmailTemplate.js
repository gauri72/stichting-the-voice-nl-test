import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    subject: { type: String, required: true, trim: true, maxlength: 240 },
    htmlBody: { type: String, required: true },
    placeholders: { type: [String], default: [] },
    thumbnailKey: { type: String, default: "", trim: true, maxlength: 80 },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "email_templates" }
);

emailTemplateSchema.index({ createdAt: -1 });

const EmailTemplate =
  mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", emailTemplateSchema);

export default EmailTemplate;
