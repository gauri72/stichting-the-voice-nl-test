import mongoose from "mongoose";

const blueprintSectionSchema = new mongoose.Schema(
  {
    sectionKey: { type: String, default: "" },
    sectionType: { type: String, required: true },
    title: { type: String, default: "" },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    images: { type: mongoose.Schema.Types.Mixed, default: {} },
    ctas: { type: [mongoose.Schema.Types.Mixed], default: [] },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const pageTemplateSchema = new mongoose.Schema(
  {
    templateId: { type: String, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, default: "general", trim: true },
    description: { type: String, default: "", maxlength: 500 },
    sectionBlueprint: { type: [blueprintSectionSchema], default: [] },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true, collection: "cms_page_templates" }
);

const PageTemplate = mongoose.models.PageTemplate || mongoose.model("PageTemplate", pageTemplateSchema);
export default PageTemplate;
