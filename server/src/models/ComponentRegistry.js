import mongoose from "mongoose";

const componentRegistrySchema = new mongoose.Schema(
  {
    componentKey: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    category: { type: String, default: "content" },
    icon: { type: String, default: "" },
    rendererKey: { type: String, default: "" },
    hasDedicatedRenderer: { type: Boolean, default: false },
    description: { type: String, default: "" },
    defaultContentShape: { type: mongoose.Schema.Types.Mixed, default: {} },
    isCustom: { type: Boolean, default: false },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "component_registry" }
);

const ComponentRegistry =
  mongoose.models.ComponentRegistry || mongoose.model("ComponentRegistry", componentRegistrySchema);
export default ComponentRegistry;
