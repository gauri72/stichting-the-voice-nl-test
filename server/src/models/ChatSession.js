import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New chat", trim: true, maxlength: 120 },
    messages: { type: [chatMessageSchema], default: [] },
    lastMessageAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true, collection: "ai_chat_sessions" }
);

const ChatSession = mongoose.models.ChatSession || mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
