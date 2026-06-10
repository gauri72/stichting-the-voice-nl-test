import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import PastData from "../models/PastData.js";
import EventTestimonial from "../models/EventTestimonial.js";
import ActivityLog from "../models/ActivityLog.js";
import EventRegistration from "../models/EventRegistration.js";
import SequenceCounter from "../models/SequenceCounter.js";
import Admin from "../models/Admin.js";
import EmailTemplate from "../models/EmailTemplate.js";
import EmailBroadcast from "../models/EmailBroadcast.js";

/**
 * Every model maps to exactly one explicitly-named collection in the active
 * database (voice_nl_26). Listing them here documents the structure and lets us
 * guarantee the integrity indexes (unique payment intent / member / email /
 * counter keys) actually exist — so no API or integration can duplicate or
 * overwrite a record, even if Mongoose autoIndex is disabled in production.
 */
const MODELS = [
  ["users", User],
  ["payment_transactions", PaymentTransaction],
  ["members", Member],
  ["memberships", Membership],
  ["past_data", PastData],
  ["reviews", EventTestimonial],
  ["activitylogs", ActivityLog],
  ["eventregistrations", EventRegistration],
  ["sequencecounters", SequenceCounter],
  ["admins", Admin],
  ["email_templates", EmailTemplate],
  ["email_broadcasts", EmailBroadcast]
];

export async function ensureIndexes() {
  const ensured = [];
  for (const [collection, Model] of MODELS) {
    try {
      // createIndexes() builds any missing schema indexes without dropping
      // existing ones, so it is safe to run on every startup.
      await Model.createIndexes();
      ensured.push(collection);
    } catch (error) {
      console.warn(`[indexes] Could not ensure indexes for "${collection}":`, error.message);
    }
  }
  console.log(`[indexes] Verified ${ensured.length}/${MODELS.length} collections: ${ensured.join(", ")}`);
}
