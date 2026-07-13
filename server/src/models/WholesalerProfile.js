import mongoose from "mongoose";

const WHOLESALER_COMPANY_TYPES = [
  "grocery_store",
  "distributor",
  "retailer",
  "restaurant",
  "hotel",
  "other",
];

const wholesalerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true, trim: true, maxlength: 200 },
    companyType: { type: String, enum: WHOLESALER_COMPANY_TYPES, required: true },
    kvkNumber: { type: String, default: "", trim: true, maxlength: 20 },
    vatNumber: { type: String, default: "", trim: true, maxlength: 50 },
    contactEmail: { type: String, default: "", trim: true, maxlength: 254 },
    contactPhone: { type: String, default: "", trim: true, maxlength: 30 },
    address: {
      street: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      postcode: { type: String, default: "", trim: true },
      country: { type: String, default: "NL", trim: true },
    },
    website: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended"],
      default: "pending",
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    approvedAt: { type: Date, default: null },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    totalOrdersMinor: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "wholesaler_profiles" }
);

wholesalerProfileSchema.index({ userId: 1 }, { unique: true });
wholesalerProfileSchema.index({ status: 1, createdAt: -1 });

export { WHOLESALER_COMPANY_TYPES };

const WholesalerProfile =
  mongoose.models.WholesalerProfile ||
  mongoose.model("WholesalerProfile", wholesalerProfileSchema);

export default WholesalerProfile;
