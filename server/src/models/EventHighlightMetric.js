import mongoose from "mongoose";

const eventHighlightMetricSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, unique: true, index: true },
    highlightViews: { type: Number, default: 0, min: 0 },
    modalOpens: { type: Number, default: 0, min: 0 },
    videoPlays: { type: Number, default: 0, min: 0 },
    completionEvents: { type: Number, default: 0, min: 0 },
    completionRateTotal: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "event_highlight_metrics" }
);

const EventHighlightMetric =
  mongoose.models.EventHighlightMetric ||
  mongoose.model("EventHighlightMetric", eventHighlightMetricSchema);

export default EventHighlightMetric;
