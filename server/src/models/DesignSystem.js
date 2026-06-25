import mongoose from "mongoose";

export const ALLOWED_FONT_FAMILIES = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "DM Sans",
  "Manrope",
  "Playfair Display",
  "Cinzel",
  "Cormorant Garamond",
  "Open Sans",
  "Raleway",
  "Nunito",
];

const stateSchema = {
  colors: { type: mongoose.Schema.Types.Mixed, default: {} },
  typography: { type: mongoose.Schema.Types.Mixed, default: {} },
  buttons: { type: mongoose.Schema.Types.Mixed, default: {} },
  layout: { type: mongoose.Schema.Types.Mixed, default: {} },
};

const designSystemSchema = new mongoose.Schema(
  {
    designSystemId: { type: String, unique: true, sparse: true, trim: true },
    draft: stateSchema,
    published: stateSchema,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "design_systems" }
);

const DesignSystem = mongoose.models.DesignSystem || mongoose.model("DesignSystem", designSystemSchema);
export default DesignSystem;
