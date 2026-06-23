import mongoose from "mongoose";

const appSettingSchema = new mongoose.Schema(
  {
    settingsId: { type: String, unique: true, sparse: true, trim: true },
    category: { type: String, required: true, index: true, trim: true },
    key: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    encrypted: { type: Boolean, default: false },
    isSecret: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "app_settings" }
);

appSettingSchema.index({ category: 1, key: 1 }, { unique: true });

const AppSetting = mongoose.models.AppSetting || mongoose.model("AppSetting", appSettingSchema);
export default AppSetting;
