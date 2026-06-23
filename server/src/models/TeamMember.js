import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    displayOrder: { type: Number, default: 0, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, default: "", trim: true, maxlength: 120 },
    designation: { type: String, default: "", trim: true, maxlength: 80 },
    teamCategory: { type: String, default: "", trim: true, maxlength: 80 },
    biography: { type: String, default: "", trim: true, maxlength: 4000 },
    imageUrl: { type: String, default: "" },
    imageAssetKey: { type: String, default: "", trim: true, maxlength: 40 },
    linkedinUrl: { type: String, default: "", trim: true, maxlength: 500 },
    email: { type: String, default: "", trim: true, maxlength: 200 },
    yearsWithVoice: { type: String, default: "", trim: true, maxlength: 40 },
    featured: { type: Boolean, default: false, index: true },
    isBoardMember: { type: Boolean, default: false, index: true },
    visible: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "team_members" }
);

teamMemberSchema.index({ visible: 1, displayOrder: 1 });

const TeamMember = mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
