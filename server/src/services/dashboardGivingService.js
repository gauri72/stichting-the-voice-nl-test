import User from "../models/User.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { isTicketTailorConfigured, loadTicketTailorAccountData, splitOrdersByCategory } from "./ticketTailorService.js";
import { buildUserMatch } from "./dashboardService.js";

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
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function buildSection(items) {
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const totalMinor = items.reduce((sum, item) => sum + (item.amountMinor || 0), 0);
  return {
    items,
    count: items.length,
    totalMinor,
    totalLabel: formatEur(totalMinor),
  };
}

/** Per-item donation/sponsorship history for a customer — the detail view behind the dashboard stat cards. */
export async function getDashboardGivingForUser(safeUser) {
  const userId = safeUser.id;
  const email = safeUser.email;

  const userDoc = await User.findById(userId).lean();
  if (!userDoc) {
    const err = new Error("User not found.");
    err.status = 404;
    throw err;
  }

  const [transactions, ticketTailorAccount] = await Promise.all([
    PaymentTransaction.find(buildUserMatch(userId, email)).sort({ paidAt: -1 }).limit(100).lean(),
    isTicketTailorConfigured()
      ? loadTicketTailorAccountData(email).catch((err) => {
          console.warn("[dashboard/giving] Ticket Tailor fetch failed:", err.message);
          return { orders: [] };
        })
      : Promise.resolve({ orders: [] }),
  ]);

  const { donations: ttDonationOrders, sponsorships: ttSponsorshipOrders } = splitOrdersByCategory(
    ticketTailorAccount.orders || []
  );

  const donationItems = [];
  const sponsorshipItems = [];

  for (const t of transactions) {
    const date = t.paidAt || t.createdAt;
    const base = {
      amountMinor: t.amountMinor || 0,
      amountLabel: formatEur(t.amountMinor),
      date: date?.toISOString?.() || null,
      dateLabel: formatDisplayDate(date),
      status: "Completed",
      receiptNumber: t.receiptNumber || "",
    };
    if (t.kind === "donation") {
      donationItems.push({ id: `pay-${t.paymentIntentId}`, source: "platform", label: t.tierName || "General Donation", ...base });
    } else if (t.kind === "sponsorship") {
      sponsorshipItems.push({ id: `pay-${t.paymentIntentId}`, source: "platform", label: t.tierName || "Sponsorship", ...base });
    }
  }

  for (const o of ttDonationOrders) {
    donationItems.push({
      id: `tt-${o.id}`,
      source: "ticketTailor",
      label: o.eventTitle || "Donation",
      amountMinor: o.amountMinor || 0,
      amountLabel: formatEur(o.amountMinor),
      date: o.createdAt || null,
      dateLabel: formatDisplayDate(o.createdAt),
      status: "Completed",
      receiptNumber: "",
    });
  }

  for (const o of ttSponsorshipOrders) {
    sponsorshipItems.push({
      id: `tt-${o.id}`,
      source: "ticketTailor",
      label: o.eventTitle || "Sponsorship",
      amountMinor: o.amountMinor || 0,
      amountLabel: formatEur(o.amountMinor),
      date: o.createdAt || null,
      dateLabel: formatDisplayDate(o.createdAt),
      status: "Completed",
      receiptNumber: "",
    });
  }

  return {
    donations: buildSection(donationItems),
    sponsorships: buildSection(sponsorshipItems),
  };
}
