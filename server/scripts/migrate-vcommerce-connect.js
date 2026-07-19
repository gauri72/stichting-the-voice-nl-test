import "dotenv/config";
import mongoose from "mongoose";
import BusinessProfile from "../src/models/BusinessProfile.js";
import { getStripe, isStripeConfigured } from "../src/services/stripe.js";
import { syncConnectedAccount } from "../src/services/businessConnectService.js";

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) throw new Error("MONGODB_URI is required.");
if (!isStripeConfigured()) throw new Error("STRIPE_SECRET_KEY is required.");

await mongoose.connect(mongoUri);
const stripe = getStripe();
let synced = 0;
let failed = 0;

for await (const business of BusinessProfile.find({
  stripeConnectedAccountId: { $exists: true, $nin: ["", null] },
}).cursor()) {
  try {
    const account = await stripe.accounts.retrieve(business.stripeConnectedAccountId);
    await syncConnectedAccount(account);
    synced += 1;
  } catch (error) {
    failed += 1;
    console.error(`Could not sync ${business.businessName} (${business.stripeConnectedAccountId}): ${error.message}`);
  }
}

console.log(`Stripe Connect migration complete: ${synced} synced, ${failed} failed.`);
await mongoose.disconnect();
