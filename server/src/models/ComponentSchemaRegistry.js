import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    fieldType: {
      type: String,
      enum: [
        // TEXT
        "heading",
        "subheading",
        "paragraph",
        "label",
        "badge",
        "card_title",
        "card_description",
        "button_text",
        // MEDIA
        "image",
        "mobile_image",
        "background_image",
        "icon",
        "video_url",
        "youtube_url",
        // CTA
        "cta_list",
        // STYLE
        "color",
        "select",
        "range",
        // LAYOUT
        "visibility",
        "richtext",
        "bullet_list",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["text", "media", "cta", "style", "layout"],
      required: true,
    },
    path: { type: String, required: true }, // e.g. "content.heading", "images.hero", "ctas", "settings.textAlign"
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const componentSchemaRegistrySchema = new mongoose.Schema(
  {
    componentKey: { type: String, required: true, unique: true, trim: true },
    fields: { type: [fieldSchema], default: [] },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true, collection: "component_schema_registry" }
);

const ComponentSchemaRegistry =
  mongoose.models.ComponentSchemaRegistry ||
  mongoose.model("ComponentSchemaRegistry", componentSchemaRegistrySchema);
export default ComponentSchemaRegistry;
