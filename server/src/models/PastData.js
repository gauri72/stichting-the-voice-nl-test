import mongoose from "mongoose";

/**
 * Aggregated Ticket Tailor history, one document per buyer email.
 * The normalized (lowercased, trimmed) email is the primary key (_id), so a
 * re-sync upserts the same document instead of creating duplicates.
 */
const pastDataSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    orders: { type: Array, default: [] },
    issuedMemberships: { type: Array, default: [] },
    orderCount: { type: Number, default: 0 },
    issuedMembershipCount: { type: Number, default: 0 },
    syncedAt: { type: Date, default: null }
  },
  { timestamps: true, collection: "past_data" }
);

const PastData = mongoose.models.PastData || mongoose.model("PastData", pastDataSchema);

export default PastData;
