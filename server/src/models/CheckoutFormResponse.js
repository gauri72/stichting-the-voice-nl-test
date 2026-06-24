import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    questionLabel: { type: String, required: true, trim: true },
    answer: { type: mongoose.Schema.Types.Mixed, default: null },
    repeatIndex: { type: Number, default: 0 },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", default: null },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", default: null },
    visibility: {
      showInEmail: { type: Boolean, default: false },
      showInPdf: { type: Boolean, default: false },
      showInAdmin: { type: Boolean, default: true },
      showInCheckIn: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const checkoutFormResponseSchema = new mongoose.Schema(
  {
    responseId: { type: String, required: true, unique: true, index: true, trim: true },
    formId: { type: String, required: true, trim: true, index: true },
    formVersion: { type: Number, default: 1 },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketOrder", default: null, index: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", default: null, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    answers: { type: [answerSchema], default: [] },
  },
  { timestamps: true, collection: "checkout_form_responses" }
);

checkoutFormResponseSchema.index({ eventId: 1, createdAt: -1 });

const CheckoutFormResponse =
  mongoose.models.CheckoutFormResponse ||
  mongoose.model("CheckoutFormResponse", checkoutFormResponseSchema);

export default CheckoutFormResponse;
