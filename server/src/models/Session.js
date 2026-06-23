import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "" },
    category: { type: String, default: "", trim: true },
    bookingType: {
      type: String,
      enum: [
        "class_booking",
        "appointment_booking",
        "resource_booking",
        "venue_booking",
        "restaurant_booking",
        "court_booking",
      ],
      default: "class_booking",
      index: true,
    },
    mode: { type: String, enum: ["online", "offline"], default: "offline" },
    location: { type: String, default: "", trim: true },
    onlineMeetingUrl: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
    capacity: { type: Number, default: 1, min: 1 },
    priceMinor: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: 60, min: 5 },
    bufferMinutes: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "paused", "fully_booked", "archived"],
      default: "draft",
      index: true,
    },
    resourceIds: { type: [String], default: [] },
    staffAssignment: { type: String, default: "", trim: true },
    bookingRules: {
      minAdvanceHours: { type: Number, default: 0 },
      maxAdvanceDays: { type: Number, default: 120 },
      cancellableUntilHours: { type: Number, default: 24 },
      rescheduleAllowed: { type: Boolean, default: true },
      cancellationAllowed: { type: Boolean, default: true },
      allowGuests: { type: Boolean, default: false },
      maxParticipantsPerBooking: { type: Number, default: 1 },
    },
    membershipSettings: {
      memberOnly: { type: Boolean, default: false },
      freeForPremium: { type: Boolean, default: false },
      memberDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
      allowedPlans: { type: [String], default: [] },
    },
    paymentMode: {
      type: String,
      enum: ["full", "deposit", "pay_later"],
      default: "full",
    },
    depositMinor: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "sessions" }
);

sessionSchema.index({ status: 1, category: 1 });

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
export default Session;
