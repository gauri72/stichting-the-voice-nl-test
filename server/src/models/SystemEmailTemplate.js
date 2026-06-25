import mongoose from "mongoose";
import { EMAIL_TEMPLATE_TYPES } from "../config/settingsConfig.js";

const systemEmailTemplateSchema = new mongoose.Schema(
  {
    templateId: { type: String, unique: true, sparse: true, trim: true, index: true },
    templateType: {
      type: String,
      enum: EMAIL_TEMPLATE_TYPES,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 240 },
    preheader: { type: String, default: "", trim: true, maxlength: 240 },
    htmlBody: { type: String, required: true, maxlength: 10000000 },
    plainTextBody: { type: String, default: "", maxlength: 10000000 },
    variables: { type: [String], default: [] },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
    version: { type: Number, default: 1 },
    defaultHtmlBody: { type: String, default: "", maxlength: 10000000 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "system_email_templates" }
);

const SystemEmailTemplate =
  mongoose.models.SystemEmailTemplate ||
  mongoose.model("SystemEmailTemplate", systemEmailTemplateSchema);
export default SystemEmailTemplate;
