import mongoose from "mongoose";

const conditionalRuleSchema = new mongoose.Schema(
  {
    sourceFieldId: { type: String, trim: true, default: "" },
    operator: { type: String, enum: ["equals", "not_equals", "contains", "in"], default: "equals" },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const checkoutFieldSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "text",
        "email",
        "phone",
        "number",
        "textarea",
        "dropdown",
        "multi_select",
        "radio",
        "checkbox",
        "date",
        "time",
        "file",
        "image",
        "url",
        "consent",
        "section_heading",
        "description_text",
      ],
      default: "text",
    },
    placeholder: { type: String, default: "", trim: true },
    helpText: { type: String, default: "", trim: true },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    repeatMode: {
      type: String,
      enum: ["order", "ticket_quantity", "participant_count", "ticket_type", "none"],
      default: "order",
    },
    visibility: { type: Boolean, default: true },
    showInEmail: { type: Boolean, default: false },
    showInPdf: { type: Boolean, default: false },
    showInAdmin: { type: Boolean, default: true },
    showInCheckIn: { type: Boolean, default: false },
    conditionalLogic: { type: [conditionalRuleSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const checkoutFormSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    scope: {
      type: String,
      enum: ["global", "event_type", "event", "ticket_type"],
      required: true,
      index: true,
    },
    eventType: { type: String, default: "", trim: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null, index: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketType", default: null, index: true },
    fields: { type: [checkoutFieldSchema], default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "checkout_forms" }
);

checkoutFormSchema.index({ scope: 1, eventType: 1, status: 1 });

const CheckoutForm =
  mongoose.models.CheckoutForm || mongoose.model("CheckoutForm", checkoutFormSchema);

export default CheckoutForm;
