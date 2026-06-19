import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const email = process.argv[2] || "shivamjoshi1726@gmail.com";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Member = (await import("../src/models/Member.js")).default;
  const Membership = (await import("../src/models/Membership.js")).default;
  const User = (await import("../src/models/User.js")).default;
  const PastData = (await import("../src/models/PastData.js")).default;
  const TicketTailorBooking = (await import("../src/models/TicketTailorBooking.js")).default;
  const { detectByEmail } = await import("../src/services/membershipDetectionService.js");

  const normalized = email.trim().toLowerCase();
  const member = await Member.findOne({ email: normalized }).lean();
  const user = await User.findOne({ email: normalized }).lean();
  let membership = null;
  if (user) {
    membership = await Membership.findOne({ userId: user._id }).sort({ endsAt: -1 }).lean();
  }
  const past = await PastData.findById(normalized).lean();
  const ttBookings = await TicketTailorBooking.find({ email: normalized }).lean();

  console.log("CHECK_MEMBERSHIP_LOOKUP");
  console.log(`email=${normalized}`);
  console.log("\n--- Local Member collection ---");
  if (member) {
    console.log(JSON.stringify({
      membershipStatus: member.membershipStatus,
      membershipType: member.membershipType,
      expiryDate: member.expiryDate,
      userId: member.userId?.toString(),
    }, null, 2));
  } else {
    console.log("NOT FOUND");
  }

  console.log("\n--- User account ---");
  console.log(user ? user._id.toString() : "NOT FOUND");

  console.log("\n--- Membership collection ---");
  if (membership) {
    console.log(JSON.stringify({
      planId: membership.planId,
      planName: membership.planName,
      active: membership.active,
      endsAt: membership.endsAt,
    }, null, 2));
  } else {
    console.log("NOT FOUND");
  }

  console.log("\n--- TicketTailor synced (PastData) ---");
  console.log(`issuedMemberships: ${past?.issuedMemberships?.length || 0}`);
  if (past?.issuedMemberships?.length) {
    console.log(JSON.stringify(past.issuedMemberships.slice(0, 5), null, 2));
  }
  console.log(`membership orders: ${past?.orders?.filter((o) => o.category === "membership").length || 0}`);

  console.log("\n--- TicketTailorBooking ---");
  console.log(`bookings: ${ttBookings.length}`);

  const result = await detectByEmail(normalized);
  console.log("\n--- Unified detection ---");
  console.log(JSON.stringify({
    localMembershipFound: Boolean(member || membership),
    ticketTailorMembershipFound: result.source === "TICKETTAILOR" || result.source === "BOTH",
    membershipSource: result.source,
    membershipType: result.membershipType,
    status: result.status,
    memberUntil: result.memberUntil,
    eligibleForBenefits: result.eligibleForBenefits,
    requiresLogin: result.requiresLogin,
    requiresAccountLinking: result.requiresAccountLinking,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
