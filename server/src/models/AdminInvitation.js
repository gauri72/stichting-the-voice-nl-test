import mongoose from "mongoose";

const adminInvitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    firstName: { type: String, default: "", trim: true, maxlength: 80 },
    lastName: { type: String, default: "", trim: true, maxlength: 80 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    roleSlug: { type: String, default: "viewer", trim: true },
    tokenHash: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    assignedModules: [{ type: String, trim: true }],
    notes: { type: String, default: "", trim: true, maxlength: 2000 },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "admin_invitations" }
);

const AdminInvitation =
  mongoose.models.AdminInvitation || mongoose.model("AdminInvitation", adminInvitationSchema);

export default AdminInvitation;
