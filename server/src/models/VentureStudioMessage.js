import mongoose from "mongoose";

const ventureStudioMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true, collection: "venture_studio_messages" }
);

ventureStudioMessageSchema.index({ createdAt: -1 });
ventureStudioMessageSchema.index({ name: "text", email: "text", subject: "text", message: "text" });

const VentureStudioMessage =
  mongoose.models.VentureStudioMessage || mongoose.model("VentureStudioMessage", ventureStudioMessageSchema);

export default VentureStudioMessage;
