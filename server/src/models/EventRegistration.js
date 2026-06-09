import mongoose from "mongoose";

/** Event sign-ups when an events API exists. */
const eventRegistrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    eventTitle: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, default: "", maxlength: 500 }
  },
  { timestamps: true, collection: "eventregistrations" }
);

const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model("EventRegistration", eventRegistrationSchema);

export default EventRegistration;
