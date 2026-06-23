import mongoose from "mongoose";

const eventVendorSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    vendorName: { type: String, required: true, trim: true, maxlength: 300 },
    contactPerson: { type: String, default: "", trim: true, maxlength: 200 },
    email: { type: String, default: "", trim: true, maxlength: 200 },
    phone: { type: String, default: "", trim: true, maxlength: 50 },
    serviceType: { type: String, default: "", trim: true, maxlength: 200 },
    confirmed: { type: Boolean, default: false },
    notes: { type: String, default: "", trim: true, maxlength: 3000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "event_vendors" }
);

eventVendorSchema.index({ eventId: 1, vendorName: 1 });

const EventVendor = mongoose.models.EventVendor || mongoose.model("EventVendor", eventVendorSchema);

export default EventVendor;
