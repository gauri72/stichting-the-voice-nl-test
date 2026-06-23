import mongoose from "mongoose";

const stagePlanSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, default: "Main Layout", trim: true, maxlength: 200 },
    floorImageUrl: { type: String, default: "" },
    imageWidth: { type: Number, default: 0 },
    imageHeight: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: true },
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "stage_plans" }
);

stagePlanSchema.index({ eventId: 1, isDefault: 1 });

const StagePlan = mongoose.models.StagePlan || mongoose.model("StagePlan", stagePlanSchema);

export default StagePlan;
