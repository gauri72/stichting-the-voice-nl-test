import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    module: { type: String, required: true, trim: true, index: true },
    action: { type: String, required: true, trim: true },
    label: { type: String, default: "", trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { timestamps: true, collection: "admin_permissions" }
);

const Permission =
  mongoose.models.Permission || mongoose.model("Permission", permissionSchema);

export default Permission;
