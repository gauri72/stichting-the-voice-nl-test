import mongoose from "mongoose";

const rsvpResponseSchema = new mongoose.Schema(
  {
    responseId: { type: String, required: true, unique: true, index: true, trim: true },
    eventSlug: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    status: { type: String, enum: ["yes", "maybe", "no"], required: true, index: true },
    guestCount: { type: Number, default: 0, min: 0 },
    guestNames: { type: [String], default: [] },
    foodPreference: { type: String, default: "", trim: true },
    messageToHost: { type: String, default: "", trim: true },
    attended: { type: Boolean, default: false, index: true },
    checkInToken: { type: String, default: "", trim: true, index: true },
    qrCodeUrl: { type: String, default: "", trim: true },
    pdfUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true, _id: true }
);

const rsvpSchema = new mongoose.Schema(
  {
    rsvpId: { type: String, required: true, unique: true, index: true, trim: true },
    eventSlug: { type: String, required: true, unique: true, index: true, trim: true },
    eventName: { type: String, required: true, trim: true, maxlength: 180 },
    eventDescription: { type: String, default: "" },
    hostName: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
    eventDate: { type: Date, required: true, index: true },
    startTime: { type: String, default: "", trim: true },
    endTime: { type: String, default: "", trim: true },
    venue: { type: String, default: "", trim: true },
    capacity: { type: Number, default: 0, min: 0 },
    rsvpDeadline: { type: Date, default: null },
    allowGuests: { type: Boolean, default: false },
    maxGuests: { type: Number, default: 0 },
    rsvpQuestions: { type: [String], default: [] },
    qrEnabled: { type: Boolean, default: true },
    pdfEnabled: { type: Boolean, default: false },
    waitlistEnabled: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published", "closed"], default: "draft", index: true },
    responses: { type: [rsvpResponseSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "rsvps" }
);

rsvpSchema.index({ "responses.email": 1 });

const RSVP = mongoose.models.RSVP || mongoose.model("RSVP", rsvpSchema);
export default RSVP;
