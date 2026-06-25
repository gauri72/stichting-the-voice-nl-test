import mongoose from "mongoose";

/** Shared call-to-action sub-schema used by Page, ReusableBlock, and dashboard config sections. */
const ctaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: "", maxlength: 200 },
    url: { type: String, default: "" },
    target: { type: String, enum: ["_self", "_blank"], default: "_self" },
    style: { type: String, default: "primary" },
    visible: { type: Boolean, default: true },
    trackingLabel: { type: String, default: "", maxlength: 100 },
  },
  { _id: false }
);

export default ctaSchema;
