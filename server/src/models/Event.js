import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true, maxlength: 10 },
    endTime: { type: String, default: "", trim: true, maxlength: 10 },
    venueName: { type: String, required: true, trim: true, maxlength: 200 },
    venueAddress: { type: String, default: "", trim: true, maxlength: 500 },
    heroImage: { type: String, default: "" },
    bookingFeeMinor: { type: Number, default: 0, min: 0 },
    salesEnabled: { type: Boolean, default: true },
    featured: { type: Boolean, default: false, index: true },
    showOnDashboard: { type: Boolean, default: true, index: true },
    membershipIncluded: { type: Boolean, default: false },
    membershipDiscountEligible: { type: Boolean, default: true },
    category: { type: String, default: "Experience", trim: true, maxlength: 80 },
    archived: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled"],
      default: "draft",
      index: true,
    },
    slug: { type: String, trim: true, maxlength: 220, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "events" }
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ slug: 1 }, { unique: true, sparse: true });

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;
