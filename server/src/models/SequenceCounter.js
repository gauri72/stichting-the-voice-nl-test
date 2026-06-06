import mongoose from "mongoose";

const sequenceCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const SequenceCounter =
  mongoose.models.SequenceCounter ||
  mongoose.model("SequenceCounter", sequenceCounterSchema);

export default SequenceCounter;
