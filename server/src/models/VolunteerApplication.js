import mongoose from "mongoose";

const volunteerApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true, collection: "volunteer_applications" }
);

volunteerApplicationSchema.index({ createdAt: -1 });
volunteerApplicationSchema.index({ name: "text", email: "text", message: "text" });

const VolunteerApplication =
  mongoose.models.VolunteerApplication || mongoose.model("VolunteerApplication", volunteerApplicationSchema);

export default VolunteerApplication;
