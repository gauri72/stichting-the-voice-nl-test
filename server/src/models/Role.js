import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    permissions: [{ type: String, trim: true }],
    isSystem: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    dashboardAccess: { type: String, default: "full", trim: true },
    legacyRole: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "admin_roles" }
);

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export default Role;
