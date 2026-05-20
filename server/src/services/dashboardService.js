import mongoose from "mongoose";
import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import Membership from "../models/Membership.js";
import EventRegistration from "../models/EventRegistration.js";

function formatEur(minor) {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      Number(minor) / 100
    );
  } catch {
    return `€${(Number(minor) / 100).toFixed(2)}`;
  }
}

function formatDisplayDate(isoOrDate) {
  if (!isoOrDate) return "";
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(d);
}

function buildUserMatch(userId, email) {
  const emailNorm = String(email || "").trim().toLowerCase();
  const conditions = [{ donorEmail: emailNorm }];
  if (userId && mongoose.isValidObjectId(userId)) {
    conditions.push({ userId: new mongoose.Types.ObjectId(userId) });
  }
  return { $or: conditions };
}

export async function getDashboardPayloadForUser(safeUser) {
  const userId = safeUser.id;
  const email = safeUser.email;

  const userDoc = await User.findById(userId).lean();
  if (!userDoc) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const oid = userDoc._id;

  const [transactions, activityLogs, membership, eventCount] = await Promise.all([
    PaymentTransaction.find(buildUserMatch(userId, email)).sort({ paidAt: -1 }).limit(100).lean(),
    ActivityLog.find({ userId: oid }).sort({ createdAt: -1 }).limit(50).lean(),
    Membership.findOne({ userId: oid, active: true }).lean(),
    EventRegistration.countDocuments({ userId: oid })
  ]);

  let donationTotalMinor = 0;
  let donationCount = 0;
  let sponsorshipCount = 0;

  for (const t of transactions) {
    if (t.kind === "donation") {
      donationTotalMinor += t.amountMinor || 0;
      donationCount += 1;
    } else if (t.kind === "sponsorship") {
      sponsorshipCount += 1;
    }
  }

  const donationLabel = formatEur(donationTotalMinor);

  const membershipOverview = membership
    ? {
        active: true,
        since: membership.startedAt?.toISOString?.() || null,
        title: "Active Member",
        subtitle: `Since ${formatDisplayDate(membership.startedAt)}`
      }
    : {
        active: false,
        since: null,
        title: "Membership",
        subtitle: "No active membership on file. Join to unlock member benefits."
      };

  const donationsOverview = {
    totalMinor: donationTotalMinor,
    totalLabel: donationLabel,
    count: donationCount,
    title: `${donationLabel} Total Donations`,
    subtitle: donationCount
      ? `Thank you — ${donationCount} donation payment${donationCount === 1 ? "" : "s"} completed.`
      : "No donations yet. Every contribution supports our mission."
  };

  const eventsOverview = {
    count: eventCount,
    title: eventCount
      ? `${eventCount} Event Registration${eventCount === 1 ? "" : "s"}`
      : "Event registrations",
    subtitle: eventCount
      ? "Your registered events."
      : "You have not registered for an event yet."
  };

  const sponsorshipsOverview = {
    count: sponsorshipCount,
    title: sponsorshipCount
      ? `${sponsorshipCount} Sponsorship${sponsorshipCount === 1 ? "" : "s"}`
      : "Sponsorships",
    subtitle: sponsorshipCount
      ? `${sponsorshipCount} sponsorship payment${sponsorshipCount === 1 ? "" : "s"} completed.`
      : "No sponsorship payments yet. Partner with us to create impact."
  };

  const activityItems = [];

  for (const t of transactions) {
    if (t.kind === "donation") {
      activityItems.push({
        id: `pay-${t.paymentIntentId}`,
        kind: "donation",
        title: "Donation completed",
        text: `${formatEur(t.amountMinor)} — ${t.tierName || "Donation"}${
          t.receiptNumber ? ` (${t.receiptNumber})` : ""
        }`,
        at: t.paidAt?.toISOString?.() || t.createdAt?.toISOString?.()
      });
    } else {
      activityItems.push({
        id: `pay-${t.paymentIntentId}`,
        kind: "sponsorship",
        title: "Sponsorship confirmed",
        text: `${formatEur(t.amountMinor)} — ${t.tierName || "Sponsorship"}${
          t.receiptNumber ? ` (${t.receiptNumber})` : ""
        }`,
        at: t.paidAt?.toISOString?.() || t.createdAt?.toISOString?.()
      });
    }
  }

  for (const log of activityLogs) {
    const title = log.kind === "profile_updated" ? "Profile updated" : "Account activity";
    activityItems.push({
      id: `log-${log._id}`,
      kind: log.kind,
      title,
      text: log.summary || log.detail || "Update recorded.",
      at: log.createdAt?.toISOString?.()
    });
  }

  activityItems.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const memberSince = formatDisplayDate(userDoc.createdAt);
  const accountStatus = userDoc.isVerified ? "Verified" : "Pending verification";

  return {
    profile: {
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      fullName: [userDoc.firstName, userDoc.lastName].filter(Boolean).join(" "),
      email: userDoc.email,
      phone: userDoc.phone || "",
      memberSince,
      memberSinceIso: userDoc.createdAt?.toISOString?.() || null,
      accountStatus
    },
    overview: {
      membership: membershipOverview,
      donations: donationsOverview,
      events: eventsOverview,
      sponsorships: sponsorshipsOverview
    },
    activity: activityItems.slice(0, 80)
  };
}
