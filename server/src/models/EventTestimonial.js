import mongoose from "mongoose";

const eventTestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, default: "Community Member", trim: true, maxlength: 80 },
    quote: { type: String, required: true, trim: true, maxlength: 2000 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    initials: { type: String, trim: true, maxlength: 4 },
    approved: { type: Boolean, default: true, index: true }
  },
  { timestamps: true, collection: "reviews" }
);

const EventTestimonial =
  mongoose.models.EventTestimonial || mongoose.model("EventTestimonial", eventTestimonialSchema);

export default EventTestimonial;
