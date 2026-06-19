import mongoose from "mongoose";

const financeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    organizationName: { type: String, default: "Stichting The V.O.I.C.E. NL" },
    address: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    vatNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    iban: { type: String, default: "" },
    bic: { type: String, default: "" },
    defaultVatRate: { type: Number, default: 21 },
    defaultCurrency: { type: String, default: "EUR" },
    invoicePrefix: { type: String, default: "INV" },
    invoiceTerms: { type: String, default: "" },
    invoiceFooterNote: { type: String, default: "" },
    paymentTermsDays: { type: Number, default: 30 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "finance_settings" }
);

const FinanceSettings =
  mongoose.models.FinanceSettings || mongoose.model("FinanceSettings", financeSettingsSchema);

export default FinanceSettings;
