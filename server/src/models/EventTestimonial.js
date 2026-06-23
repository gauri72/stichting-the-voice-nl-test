import mongoose from "mongoose";

const eventTestimonialSchema = new mongoose.Schema(
  {
    reviewId: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, default: "Community Member", trim: true, maxlength: 80 },
    quote: { type: String, required: true, trim: true, maxlength: 2000 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    initials: { type: String, trim: true, maxlength: 4 },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    eventName: { type: String, default: "", trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "hidden"],
      default: "pending",
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    consentAccepted: { type: Boolean, default: false },
    approved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "reviews" }
);

eventTestimonialSchema.index({ featured: -1, rating: -1, createdAt: -1 });

const EventTestimonial =
  mongoose.models.EventTestimonial || mongoose.model("EventTestimonial", eventTestimonialSchema);

export default EventTestimonial;
