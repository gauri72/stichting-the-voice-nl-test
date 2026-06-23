import mongoose from "mongoose";
import { STAGE_ELEMENT_TYPES } from "../config/eventOperationsConfig.js";

const stagePlanElementSchema = new mongoose.Schema(
  {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "StagePlan", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    label: { type: String, default: "", trim: true, maxlength: 200 },
    elementType: { type: String, enum: STAGE_ELEMENT_TYPES, default: "Stage" },
    xPercent: { type: Number, default: 10, min: 0, max: 100 },
    yPercent: { type: Number, default: 10, min: 0, max: 100 },
    widthPercent: { type: Number, default: 15, min: 1, max: 100 },
    heightPercent: { type: Number, default: 10, min: 1, max: 100 },
    rotation: { type: Number, default: 0 },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    color: { type: String, default: "#008080", trim: true, maxlength: 20 },
    locked: { type: Boolean, default: false },
    zIndex: { type: Number, default: 1 },
  },
  { timestamps: true, collection: "stage_plan_elements" }
);

stagePlanElementSchema.index({ planId: 1, zIndex: 1 });

const StagePlanElement =
  mongoose.models.StagePlanElement || mongoose.model("StagePlanElement", stagePlanElementSchema);

export default StagePlanElement;
