import mongoose from "mongoose";

const savedPromptSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    promptText: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, default: "general", trim: true, maxlength: 60 },
    isFavourite: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "ai_saved_prompts" }
);

const SavedPrompt = mongoose.models.SavedPrompt || mongoose.model("SavedPrompt", savedPromptSchema);

export default SavedPrompt;
