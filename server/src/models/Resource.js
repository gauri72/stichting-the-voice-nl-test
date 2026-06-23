import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    resourceId: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: {
      type: String,
      enum: ["trainer", "coach", "court", "room", "table", "hall", "equipment", "instructor", "other"],
      default: "other",
      index: true,
    },
    description: { type: String, default: "" },
    location: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "resources" }
);

const Resource = mongoose.models.Resource || mongoose.model("Resource", resourceSchema);
export default Resource;
