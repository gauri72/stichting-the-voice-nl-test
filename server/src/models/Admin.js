import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: "" },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    role: {
      type: String,
      enum: ["admin", "superadmin", "finance", "event_manager", "viewer"],
      default: "admin",
    },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null, index: true },
    roleSlug: { type: String, default: "", trim: true, index: true },
    customPermissions: [{ type: String, trim: true }],
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    assignedModules: [{ type: String, trim: true }],
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    profilePhotoUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["invited", "active", "suspended", "disabled"],
      default: "active",
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    invitedAt: { type: Date, default: null },
    invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminInvitation", default: null },
  },
  { timestamps: true, collection: "admins" }
);

adminSchema.methods.toSafeJSON = function toSafeJSON(extra = {}) {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone || "",
    role: this.role,
    roleId: this.roleId?.toString?.() || null,
    roleSlug: this.roleSlug || "",
    customPermissions: this.customPermissions || [],
    assignedEvents: (this.assignedEvents || []).map((id) => id.toString()),
    assignedModules: this.assignedModules || [],
    notes: this.notes || "",
    profilePhotoUrl: this.profilePhotoUrl || "",
    status: this.status || (this.isActive ? "active" : "disabled"),
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    ...extra,
  };
};

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
