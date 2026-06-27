import mongoose from "mongoose";

const prebuiltPromptSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, default: "general", trim: true, maxlength: 60 },
  },
  { _id: true }
);

// One global, singleton document (key: "default") holding the feature toggle,
// per-membership-tier daily limits, and the admin-curated pre-built prompt library.
const aiAssistantSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    enabled: { type: Boolean, default: true },
    tierLimits: {
      type: Map,
      of: Number,
      default: () => ({
        student: 20,
        privilegedSingle: 30,
        privilegedFamily: 30,
        premiumSingle: -1, // -1 = unlimited
        premiumFamily: -1,
        single: 20,
        family: 20,
        privileged: 30,
        vownl: 30,
        none: 10, // no active membership
      }),
    },
    prebuiltPrompts: { type: [prebuiltPromptSchema], default: [] },
  },
  { timestamps: true, collection: "ai_assistant_settings" }
);

const AiAssistantSettings =
  mongoose.models.AiAssistantSettings || mongoose.model("AiAssistantSettings", aiAssistantSettingsSchema);

export default AiAssistantSettings;
