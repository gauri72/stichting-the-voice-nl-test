import mongoose from "mongoose";
import { checkoutFieldSchema } from "./CheckoutForm.js";

const checkoutFormVersionSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, index: true, trim: true },
    checkoutFormRef: { type: mongoose.Schema.Types.ObjectId, ref: "CheckoutForm", required: true, index: true },
    version: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    formType: { type: String, default: "custom", trim: true },
    scope: { type: String, required: true },
    fields: { type: [checkoutFieldSchema], default: [] },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published" },
    publishedAt: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "checkout_form_versions" }
);

checkoutFormVersionSchema.index({ formId: 1, version: -1 });

const CheckoutFormVersion =
  mongoose.models.CheckoutFormVersion ||
  mongoose.model("CheckoutFormVersion", checkoutFormVersionSchema);

export default CheckoutFormVersion;
