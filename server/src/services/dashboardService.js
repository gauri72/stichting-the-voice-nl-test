import mongoose from "mongoose";
import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import ActivityLog from "../models/ActivityLog.js";
import Membership from "../models/Membership.js";
import EventRegistration from "../models/EventRegistration.js";
import { getOrdersForEmail, isTicketTailorConfigured } from "./ticketTailorService.js";

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

  const ticketTailorPromise = isTicketTailorConfigured()
    ? getOrdersForEmail(email).catch((err) => {
        console.warn("[dashboard] Ticket Tailor fetch failed:", err.message);
        return [];
      })
    : Promise.resolve([]);

  const [transactions, activityLogs, membership, localEventCount, ticketTailorOrders] =
    await Promise.all([
      PaymentTransaction.find(buildUserMatch(userId, email)).sort({ paidAt: -1 }).limit(100).lean(),
      ActivityLog.find({ userId: oid }).sort({ createdAt: -1 }).limit(50).lean(),
      Membership.findOne({ userId: oid }).sort({ startedAt: -1 }).lean(),
      EventRegistration.countDocuments({ userId: oid }),
      ticketTailorPromise
    ]);

  const ticketOrderCount = ticketTailorOrders.length;
  const eventCount = isTicketTailorConfigured() ? ticketOrderCount : localEventCount;

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

  const membershipActive =
    membership?.active &&
    (!membership.endsAt || new Date(membership.endsAt) >= new Date());

  const membershipOverview = membershipActive
    ? {
        active: true,
        since: membership.startedAt?.toISOString?.() || null,
        value: "Active",
        heading: "Member",
        description: membership.endsAt
          ? `Valid until ${formatDisplayDate(membership.endsAt)}`
          : `Since ${formatDisplayDate(membership.startedAt)}`
      }
    : {
        active: false,
        since: null,
        value: "—",
        heading: "Member",
        description: "No active membership on file. Join to unlock member benefits."
      };

  const donationsOverview = {
    totalMinor: donationTotalMinor,
    totalLabel: donationLabel,
    count: donationCount,
    value: donationLabel,
    heading: "Total Donations",
    description: donationCount
      ? "Thank you for your support!"
      : "No donations yet. Every contribution supports our mission."
  };

  const eventsOverview = {
    count: eventCount,
    value: String(eventCount),
    heading: "Events Registered",
    description: eventCount
      ? ticketOrderCount
        ? "Ticket purchases via Ticket Tailor"
        : "Upcoming events"
      : "You have not registered for an event yet."
  };

  const sponsorshipsOverview = {
    count: sponsorshipCount,
    value: String(sponsorshipCount),
    heading: "Sponsorships",
    description: sponsorshipCount ? "Active sponsorships" : "No sponsorship payments yet."
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

  for (const o of ticketTailorOrders) {
    activityItems.push({
      id: `tt-${o.id}`,
      kind: "event_ticket",
      title: "Event ticket purchased",
      text: o.eventTitle,
      at: o.createdAt
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
