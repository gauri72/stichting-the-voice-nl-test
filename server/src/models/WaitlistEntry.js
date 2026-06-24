import mongoose from "mongoose";

const waitlistEntrySchema = new mongoose.Schema(
  {
    waitlistId: { type: String, required: true, unique: true, index: true, trim: true },
    resourceType: {
      type: String,
      enum: ["event", "ticket_type", "session", "rsvp", "festival_pass"],
      required: true,
      index: true,
    },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", default: null },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    position: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ["waiting", "notified", "converted", "expired", "cancelled"],
      default: "waiting",
      index: true,
    },
    notifiedAt: { type: Date, default: null },
    purchaseWindowEndsAt: { type: Date, default: null },
    convertedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketOrder", default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "waitlist_entries" }
);

waitlistEntrySchema.index({ resourceType: 1, resourceId: 1, status: 1, position: 1 });

const WaitlistEntry =
  mongoose.models.WaitlistEntry || mongoose.model("WaitlistEntry", waitlistEntrySchema);

export default WaitlistEntry;
