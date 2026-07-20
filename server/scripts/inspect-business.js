// Read-only diagnostic: prints a V.Commerce business's payout-registration data
// and flags fields Stripe requires that are still missing. Never writes anything,
// never prints the raw Mongo URI or the raw Stripe bank token value.
//
// Run from the server/ directory, in an environment that already has MONGODB_URI
// configured (e.g. Render's Shell tab for voice-nl-api) — do NOT paste the
// connection string anywhere else to run this locally.
//
// Usage: node scripts/inspect-business.js "<business name or partial match>"
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import BusinessProfile from "../src/models/BusinessProfile.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const query = process.argv[2];
if (!query) {
  console.error('Usage: node scripts/inspect-business.js "<business name>"');
  process.exit(1);
}

const REQUIRED = {
  individual: ["legalName (first+last)", "dateOfBirth", "address.street", "address.postalCode", "address.city", "address.country", "IBAN (ibanLast4 or a fresh bank token)"],
  company: ["companyLegalName", "companyRegistrationNumber", "vatNumber", "representative.legalName (first+last)", "representative.dateOfBirth", "representative.address.street", "representative.address.postalCode", "representative.address.city", "representative.address.country", "IBAN (ibanLast4 or a fresh bank token)"],
};

function has(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in this environment.");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || "voice_nl_26" });

  const business = await BusinessProfile.findOne({
    businessName: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
  }).lean();

  if (!business) {
    console.log(`No business found matching "${query}".`);
    await mongoose.disconnect();
    return;
  }

  const reg = business.payoutRegistration || {};
  const isCompany = reg.entityType === "company";
  const person = isCompany ? reg.representative || {} : reg;

  console.log("=== Business ===");
  console.log({
    businessName: business.businessName,
    contactEmail: business.contactEmail,
    contactPhone: business.contactPhone,
    website: business.website,
    country: business.location?.country,
    companyRegistrationNumber: business.companyRegistrationNumber || null,
    vatNumber: business.vatNumber || null,
  });

  console.log("\n=== Stripe Connect state ===");
  console.log({
    stripeConnectedAccountId: business.stripeConnectedAccountId || "(none — no account created yet)",
    stripeConnectStatus: business.stripeConnectStatus || null,
    stripeDetailsSubmitted: business.stripeDetailsSubmitted || false,
    stripeChargesEnabled: business.stripeChargesEnabled || false,
    payoutsEnabled: business.payoutsEnabled || false,
    stripeTransfersEnabled: business.stripeTransfersEnabled || false,
    stripeRequirementsCurrentlyDue: business.stripeRequirementsCurrentlyDue || [],
    stripeDisabledReason: business.stripeDisabledReason || null,
  });

  console.log("\n=== Payout registration ===");
  console.log({
    entityType: reg.entityType || "(not set)",
    ...(isCompany
      ? { companyLegalName: reg.companyLegalName || null, representativeLegalName: reg.representative?.legalName || null }
      : { legalName: reg.legalName || null }),
    dateOfBirth: person.dateOfBirth ? "present" : "missing",
    address: person.address ? { street: person.address.street, houseNumber: person.address.houseNumber, postalCode: person.address.postalCode, city: person.address.city, country: person.address.country } : "missing",
    ibanLast4: reg.ibanLast4 || null,
    hasStoredBankToken: Boolean(reg.stripeBankToken), // never printing the token value itself
  });

  console.log("\n=== Gaps vs Stripe's requirements ===");
  const requiredFields = REQUIRED[isCompany ? "company" : "individual"];
  const checks = {
    "legalName (first+last)": has(isCompany ? reg.representative?.legalName : reg.legalName) && /\s/.test(isCompany ? reg.representative?.legalName : reg.legalName),
    "representative.legalName (first+last)": has(reg.representative?.legalName) && /\s/.test(reg.representative?.legalName || ""),
    dateOfBirth: has(person.dateOfBirth),
    "representative.dateOfBirth": has(reg.representative?.dateOfBirth),
    "address.street": has(person.address?.street),
    "representative.address.street": has(reg.representative?.address?.street),
    "address.postalCode": has(person.address?.postalCode),
    "representative.address.postalCode": has(reg.representative?.address?.postalCode),
    "address.city": has(person.address?.city),
    "representative.address.city": has(reg.representative?.address?.city),
    "address.country": has(person.address?.country),
    "representative.address.country": has(reg.representative?.address?.country),
    companyLegalName: has(reg.companyLegalName),
    companyRegistrationNumber: has(business.companyRegistrationNumber),
    vatNumber: has(business.vatNumber),
    "IBAN (ibanLast4 or a fresh bank token)": has(reg.ibanLast4) || Boolean(reg.stripeBankToken),
  };

  const gaps = requiredFields.filter((f) => checks[f] === false);
  if (gaps.length) {
    console.log(`Missing for a ${isCompany ? "company" : "individual"} account:`);
    gaps.forEach((g) => console.log(`  ✗ ${g}`));
  } else {
    console.log(`All required fields for a ${isCompany ? "company" : "individual"} account are present.`);
  }
  console.log(
    "\nNote: Stripe's hosted onboarding (the page 'Set up payouts' redirects to) will always ask for anything not prefilled, and re-verify the bank account regardless — this list is about what we CAN prefill, not a hard blocker."
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("inspect-business failed:", err.message);
  process.exit(1);
});
