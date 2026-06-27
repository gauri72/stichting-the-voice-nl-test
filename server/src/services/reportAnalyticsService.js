import User from "../models/User.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import Event from "../models/Event.js";
import Ticket from "../models/Ticket.js";
import TicketOrder from "../models/TicketOrder.js";
import TicketType from "../models/TicketType.js";
import TicketTailorBooking from "../models/TicketTailorBooking.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Sponsorship from "../models/Sponsorship.js";
import Donation from "../models/Donation.js";
import DiscountUsage from "../models/DiscountUsage.js";
import DiscountRule from "../models/DiscountRule.js";
import Invoice from "../models/Invoice.js";
import FinanceTransaction from "../models/FinanceTransaction.js";
import EventBudget from "../models/EventBudget.js";
import FinanceAuditLog from "../models/FinanceAuditLog.js";
import { getTicketStats } from "./ticketAdminService.js";
import { getTicketTailorStats } from "./ticketTailorBookingSyncService.js";
import { getSponsorshipDashboardStats } from "./adminSponsorshipService.js";
import { getDonationDashboardStats } from "./adminDonationService.js";
import { getFinanceDashboardStats } from "./adminFinanceDashboardService.js";
import { getNextSequence } from "../utils/sequence.js";

function formatEur(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    Number(minor || 0) / 100
  );
}

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function trendDir(change) {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Resolve date range from query params */
export function parseReportDateRange(params = {}) {
  const now = new Date();
  const preset = params.preset || params.dateRange || "last30";
  const customFrom = params.dateFrom ? new Date(params.dateFrom) : null;
  const customTo = params.dateTo ? endOfDay(new Date(params.dateTo)) : null;

  let from;
  let to = endOfDay(now);

  switch (preset) {
    case "today":
      from = startOfDay(now);
      break;
    case "yesterday": {
      const y = addDays(now, -1);
      from = startOfDay(y);
      to = endOfDay(y);
      break;
    }
    case "last7":
      from = startOfDay(addDays(now, -6));
      break;
    case "last30":
      from = startOfDay(addDays(now, -29));
      break;
    case "thisMonth":
      from = startOfMonth(now);
      break;
    case "lastMonth": {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from = startOfMonth(lm);
      to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      break;
    }
    case "thisYear":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      from = customFrom ? startOfDay(customFrom) : startOfDay(addDays(now, -29));
      to = customTo || endOfDay(now);
      break;
    default:
      from = startOfDay(addDays(now, -29));
  }

  const spanMs = to - from;
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - spanMs);

  return { from, to, prevFrom, prevTo, preset };
}

function dateMatch(field, from, to) {
  return { [field]: { $gte: from, $lte: to } };
}

async function sumPaymentTransactions(filter) {
  const agg = await PaymentTransaction.aggregate([
    { $match: filter },
    { $group: { _id: "$kind", total: { $sum: "$amountMinor" }, count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(agg.map((r) => [r._id, r]));
  return {
    sponsorship: map.sponsorship?.total || 0,
    donation: map.donation?.total || 0,
    membership: map.membership?.total || 0,
    total: agg.reduce((s, r) => s + r.total, 0),
  };
}

async function dailySparkline(model, dateField, from, to, sumField = null) {
  const group = sumField
    ? { total: { $sum: `$${sumField}` }, count: { $sum: 1 } }
    : { count: { $sum: 1 } };
  const rows = await model.aggregate([
    { $match: dateMatch(dateField, from, to) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
        ...group,
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({
    date: r._id,
    value: sumField ? r.total : r.count,
  }));
}

function metricCard(label, current, previous, sparkline = [], format = "number") {
  const change = pctChange(current, previous);
  return {
    label,
    value: format === "currency" ? formatEur(current) : current,
    valueRaw: current,
    previous,
    change,
    trend: trendDir(change),
    sparkline,
  };
}

export async function getRevenueSummary(params = {}) {
  const { from, to, prevFrom, prevTo } = parseReportDateRange(params);

  const [
    ticketRevenue,
    prevTicketRevenue,
    ttStats,
    payments,
    prevPayments,
    invoicePaid,
    prevInvoicePaid,
    refunds,
    trend,
  ] = await Promise.all([
    TicketOrder.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("createdAt", from, to) } },
      { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
    ]),
    TicketOrder.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("createdAt", prevFrom, prevTo) } },
      { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
    ]),
    getTicketTailorStats(),
    sumPaymentTransactions(dateMatch("paidAt", from, to)),
    sumPaymentTransactions(dateMatch("paidAt", prevFrom, prevTo)),
    Invoice.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("invoiceDate", from, to) } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Invoice.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("invoiceDate", prevFrom, prevTo) } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Ticket.countDocuments({ status: "refunded", ...dateMatch("updatedAt", from, to) }),
    PaymentTransaction.aggregate([
      { $match: dateMatch("paidAt", from, to) },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
          total: { $sum: "$amountMinor" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const ticketMinor = ticketRevenue[0]?.total || 0;
  const prevTicketMinor = prevTicketRevenue[0]?.total || 0;
  const invoiceMinor = invoicePaid[0]?.total || 0;
  const prevInvoiceMinor = prevInvoicePaid[0]?.total || 0;

  const sources = [
    { source: "Platform Tickets", amountMinor: ticketMinor, amount: formatEur(ticketMinor) },
    { source: "TicketTailor", amountMinor: ttStats.totalRevenueMinor, amount: formatEur(ttStats.totalRevenueMinor) },
    { source: "Memberships", amountMinor: payments.membership, amount: formatEur(payments.membership) },
    { source: "Sponsorships", amountMinor: payments.sponsorship, amount: formatEur(payments.sponsorship) },
    { source: "Donations", amountMinor: payments.donation, amount: formatEur(payments.donation) },
    { source: "Invoices", amountMinor: invoiceMinor, amount: formatEur(invoiceMinor) },
  ];

  const totalMinor =
    ticketMinor + ttStats.totalRevenueMinor + payments.total + invoiceMinor;

  const prevTotalMinor =
    prevTicketMinor + prevPayments.total + prevInvoiceMinor;

  const byEvent = await TicketOrder.aggregate([
    { $match: { paymentStatus: { $in: ["paid", "free"] }, ...dateMatch("createdAt", from, to) } },
    { $group: { _id: "$eventId", revenue: { $sum: "$totalAmountMinor" }, orders: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
    { $limit: 15 },
  ]);

  const eventIds = byEvent.map((e) => e._id).filter(Boolean);
  const events = await Event.find({ _id: { $in: eventIds } }).select("title").lean();
  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e.title]));

  const pendingRevenue = await TicketOrder.aggregate([
    { $match: { paymentStatus: "pending", ...dateMatch("createdAt", from, to) } },
    { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
  ]);

  return {
    dateRange: { from, to, preset: params.preset || "last30" },
    summary: {
      totalRevenue: formatEur(totalMinor),
      totalRevenueMinor: totalMinor,
      netRevenue: formatEur(totalMinor),
      netRevenueMinor: totalMinor,
      pendingRevenue: formatEur(pendingRevenue[0]?.total || 0),
      refunds,
      change: pctChange(totalMinor, prevTotalMinor),
    },
    bySource: sources,
    revenueTrend: trend.map((t) => ({
      period: t._id,
      revenue: t.total,
      revenueFormatted: formatEur(t.total),
    })),
    byEvent: byEvent.map((e) => ({
      eventId: e._id?.toString(),
      eventTitle: eventMap[e._id?.toString()] || "Unknown",
      revenue: e.revenue,
      revenueFormatted: formatEur(e.revenue),
      orders: e.orders,
    })),
    paidVsPending: {
      paid: totalMinor,
      pending: pendingRevenue[0]?.total || 0,
    },
  };
}

export async function getEventPerformance(params = {}) {
  const { from, to } = parseReportDateRange(params);
  const now = new Date();

  const [total, published, featured, upcoming, past, byEventTickets, capacityData] = await Promise.all([
    Event.countDocuments({ archived: { $ne: true } }),
    Event.countDocuments({ status: "published", archived: { $ne: true } }),
    Event.countDocuments({ featured: true, archived: { $ne: true } }),
    Event.countDocuments({ date: { $gte: now }, archived: { $ne: true } }),
    Event.countDocuments({ date: { $lt: now }, archived: { $ne: true } }),
    Ticket.aggregate([
      { $match: { status: "valid", ...dateMatch("createdAt", from, to) } },
      { $group: { _id: "$eventId", sold: { $sum: 1 }, checkedIn: { $sum: { $cond: ["$checkedIn", 1, 0] } } } },
      { $sort: { sold: -1 } },
      { $limit: 20 },
    ]),
    TicketType.aggregate([
      { $group: { _id: "$eventId", capacity: { $sum: "$capacity" }, sold: { $sum: "$soldCount" } } },
    ]),
  ]);

  const eventIds = [...new Set([...byEventTickets.map((e) => e._id), ...capacityData.map((c) => c._id)])];
  const events = await Event.find({ _id: { $in: eventIds } }).select("title date venueName").lean();
  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e]));

  const revenueByEvent = await TicketOrder.aggregate([
    { $match: { paymentStatus: "paid", ...dateMatch("createdAt", from, to) } },
    { $group: { _id: "$eventId", revenue: { $sum: "$totalAmountMinor" } } },
  ]);
  const revenueMap = Object.fromEntries(revenueByEvent.map((r) => [r._id?.toString(), r.revenue]));

  const topEvents = byEventTickets.map((row) => {
    const ev = eventMap[row._id?.toString()];
    const cap = capacityData.find((c) => c._id?.toString() === row._id?.toString());
    const capacity = cap?.capacity || 0;
    const sold = row.sold || 0;
    return {
      eventId: row._id?.toString(),
      title: ev?.title || "Unknown",
      date: ev?.date,
      ticketsSold: sold,
      checkedIn: row.checkedIn,
      revenue: revenueMap[row._id?.toString()] || 0,
      revenueFormatted: formatEur(revenueMap[row._id?.toString()] || 0),
      capacity,
      utilization: capacity ? Math.round((sold / capacity) * 100) : null,
    };
  });

  return {
    dateRange: { from, to },
    summary: { total, published, featured, upcoming, past },
    topEvents,
    ticketsByEvent: topEvents.map((e) => ({ name: e.title, value: e.ticketsSold })),
    revenueByEvent: topEvents.map((e) => ({ name: e.title, value: e.revenue })),
    attendanceVsCapacity: topEvents
      .filter((e) => e.capacity > 0)
      .map((e) => ({
        name: e.title,
        sold: e.ticketsSold,
        capacity: e.capacity,
      })),
  };
}

export async function getTicketingAnalytics(params = {}) {
  const { from, to } = parseReportDateRange(params);
  const stats = await getTicketStats();
  const tt = await getTicketTailorStats();

  const [freeBookings, paidBookings, byType, salesTrend, checkInTrend] = await Promise.all([
    TicketOrder.countDocuments({ paymentStatus: "free", ...dateMatch("createdAt", from, to) }),
    TicketOrder.countDocuments({ paymentStatus: "paid", ...dateMatch("createdAt", from, to) }),
    Ticket.aggregate([
      { $match: { status: "valid", ...dateMatch("createdAt", from, to) } },
      { $group: { _id: "$ticketTypeName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    dailySparkline(TicketOrder, "createdAt", from, to),
    dailySparkline(Ticket, "checkedInAt", from, to),
  ]);

  const validTickets = await Ticket.countDocuments({
    status: "valid",
    ...dateMatch("createdAt", from, to),
  });
  const checkedIn = await Ticket.countDocuments({
    checkedIn: true,
    status: "valid",
    ...dateMatch("createdAt", from, to),
  });
  const noShows = Math.max(0, validTickets - checkedIn);

  return {
    dateRange: { from, to },
    summary: {
      ...stats,
      ticketTailorBookings: tt.totalBookings,
      ticketTailorRevenue: formatEur(tt.totalRevenueMinor),
      freeBookings,
      paidBookings,
      noShows,
      checkInRate: validTickets ? Math.round((checkedIn / validTickets) * 100) : 0,
    },
    ticketsByType: byType.map((t) => ({ name: t._id || "Unknown", value: t.count })),
    salesTrend: salesTrend.map((d) => ({ date: d.date, value: d.count })),
    checkInTrend: checkInTrend.map((d) => ({ date: d.date, value: d.count })),
    checkInsVsNoShows: [
      { name: "Checked In", value: checkedIn },
      { name: "No-show", value: noShows },
    ],
  };
}

export async function getMembershipAnalytics(params = {}) {
  const { from, to, prevFrom, prevTo } = parseReportDateRange(params);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const soon = addDays(now, 30);

  const [
    totalMembers,
    activeMembers,
    expiredMembers,
    expiringSoon,
    newThisMonth,
    newInRange,
    prevNewInRange,
    byType,
    renewals,
    revenueAgg,
    growthTrend,
  ] = await Promise.all([
    Member.countDocuments({}),
    Member.countDocuments({ membershipStatus: "active", expiryDate: { $gte: now } }),
    Member.countDocuments({ membershipStatus: "expired" }),
    Member.countDocuments({ membershipStatus: "active", expiryDate: { $gte: now, $lte: soon } }),
    Member.countDocuments({ createdAt: { $gte: monthStart } }),
    Member.countDocuments(dateMatch("createdAt", from, to)),
    Member.countDocuments(dateMatch("createdAt", prevFrom, prevTo)),
    Member.aggregate([
      { $group: { _id: "$planId", count: { $sum: 1 }, revenue: { $sum: "$amountPaidMinor" } } },
      { $sort: { count: -1 } },
    ]),
    Member.countDocuments({
      notes: /renewal/i,
      ...dateMatch("createdAt", from, to),
    }),
    PaymentTransaction.aggregate([
      { $match: { kind: "membership", ...dateMatch("paidAt", from, to) } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
    Member.aggregate([
      { $match: dateMatch("createdAt", from, to) },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const platformActive = await Membership.countDocuments({ active: true });

  return {
    dateRange: { from, to },
    summary: {
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      newMembersThisMonth: newThisMonth,
      newInRange,
      change: pctChange(newInRange, prevNewInRange),
      platformMemberships: platformActive,
      membershipRevenue: formatEur(revenueAgg[0]?.total || 0),
      membershipRevenueMinor: revenueAgg[0]?.total || 0,
      renewals,
    },
    byType: byType.map((t) => ({
      type: t._id || "Unknown",
      count: t.count,
      revenue: t.revenue,
      revenueFormatted: formatEur(t.revenue),
    })),
    typeDistribution: byType.map((t) => ({ name: t._id || "Unknown", value: t.count })),
    growthTrend: growthTrend.map((g) => ({ period: g._id, count: g.count })),
  };
}

export async function getSponsorshipAnalytics(params = {}) {
  const { from, to } = parseReportDateRange(params);
  const stats = await getSponsorshipDashboardStats();

  const [byPackage, byCampaign, trend] = await Promise.all([
    Sponsorship.aggregate([
      { $match: { paymentStatus: { $in: ["paid", "partially_paid"] }, ...dateMatch("paymentDate", from, to) } },
      { $group: { _id: "$packageName", revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]),
    Sponsorship.aggregate([
      { $match: dateMatch("createdAt", from, to) },
      { $group: { _id: "$campaignName", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Sponsorship.aggregate([
      { $match: { paymentStatus: "paid", paymentDate: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  const topSponsors = await Sponsorship.find({ paymentStatus: "paid" })
    .sort({ amount: -1 })
    .limit(10)
    .select("sponsorName companyName amount campaignName paymentDate")
    .lean();

  return {
    dateRange: { from, to },
    summary: stats,
    byPackage: byPackage.map((p) => ({
      package: p._id || "Unknown",
      revenue: p.revenue,
      revenueFormatted: formatEur(p.revenue),
      count: p.count,
    })),
    byCampaign: byCampaign.map((c) => ({
      campaign: c._id || "General",
      count: c.count,
      revenue: c.revenue,
      revenueFormatted: formatEur(c.revenue),
    })),
    revenueTrend: trend.map((t) => ({
      period: t._id,
      revenue: t.revenue,
      revenueFormatted: formatEur(t.revenue),
    })),
    topSponsors: topSponsors.map((s) => ({
      name: s.sponsorName,
      company: s.companyName,
      amount: formatEur(s.amount),
      campaign: s.campaignName,
      date: s.paymentDate,
    })),
    packageChart: byPackage.map((p) => ({ name: p._id || "Unknown", value: p.revenue })),
  };
}

export async function getDonationAnalytics(params = {}) {
  const { from, to } = parseReportDateRange(params);
  const stats = await getDonationDashboardStats();

  const [byCampaign, trend, avgAgg, topDonors] = await Promise.all([
    Donation.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("donationDate", from, to) } },
      { $group: { _id: "$campaignName", revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
    ]),
    Donation.aggregate([
      { $match: { paymentStatus: "paid", donationDate: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$donationDate" } },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    Donation.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("donationDate", from, to) } },
      { $group: { _id: null, avg: { $avg: "$amount" }, total: { $sum: "$amount" } } },
    ]),
    Donation.find({ paymentStatus: "paid", isAnonymous: { $ne: true } })
      .sort({ amount: -1 })
      .limit(10)
      .select("donorName email amount campaignName donationDate")
      .lean(),
  ]);

  return {
    dateRange: { from, to },
    summary: {
      ...stats,
      averageDonation: formatEur(Math.round(avgAgg[0]?.avg || 0)),
      averageDonationMinor: Math.round(avgAgg[0]?.avg || 0),
    },
    byCampaign: byCampaign.map((c) => ({
      campaign: c._id || "General",
      revenue: c.revenue,
      revenueFormatted: formatEur(c.revenue),
      count: c.count,
    })),
    revenueTrend: trend.map((t) => ({
      period: t._id,
      revenue: t.revenue,
      revenueFormatted: formatEur(t.revenue),
    })),
    campaignChart: byCampaign.map((c) => ({ name: c._id || "General", value: c.revenue })),
    topDonors: topDonors.map((d) => ({
      name: d.donorName,
      email: d.email,
      amount: formatEur(d.amount),
      campaign: d.campaignName,
      date: d.donationDate,
    })),
  };
}

export async function getDiscountAnalytics(params = {}) {
  const { from, to } = parseReportDateRange(params);

  const [usageAgg, byCode, byEvent, trend, totalRules] = await Promise.all([
    DiscountUsage.aggregate([
      { $match: dateMatch("usedAt", from, to) },
      {
        $group: {
          _id: null,
          uses: { $sum: 1 },
          totalDiscount: { $sum: "$discountAmount" },
          revenueAfter: { $sum: "$totalAfterDiscount" },
        },
      },
    ]),
    DiscountUsage.aggregate([
      { $match: dateMatch("usedAt", from, to) },
      { $group: { _id: "$code", uses: { $sum: 1 }, savings: { $sum: "$discountAmount" } } },
      { $sort: { uses: -1 } },
      { $limit: 15 },
    ]),
    DiscountUsage.aggregate([
      { $match: { eventId: { $ne: null }, ...dateMatch("usedAt", from, to) } },
      { $group: { _id: "$eventId", uses: { $sum: 1 }, savings: { $sum: "$discountAmount" } } },
      { $sort: { uses: -1 } },
      { $limit: 10 },
    ]),
    DiscountUsage.aggregate([
      { $match: dateMatch("usedAt", from, to) },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$usedAt" } },
          savings: { $sum: "$discountAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    DiscountRule.countDocuments({ status: "active" }),
  ]);

  const eventIds = byEvent.map((e) => e._id).filter(Boolean);
  const events = await Event.find({ _id: { $in: eventIds } }).select("title").lean();
  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e.title]));

  const summary = usageAgg[0] || { uses: 0, totalDiscount: 0, revenueAfter: 0 };

  return {
    dateRange: { from, to },
    summary: {
      codesUsed: summary.uses,
      totalDiscountValue: formatEur(summary.totalDiscount),
      totalDiscountMinor: summary.totalDiscount,
      revenueAfterDiscount: formatEur(summary.revenueAfter),
      activeRules: totalRules,
    },
    byCode: byCode.map((c) => ({
      code: c._id || "—",
      uses: c.uses,
      savings: c.savings,
      savingsFormatted: formatEur(c.savings),
    })),
    byEvent: byEvent.map((e) => ({
      event: eventMap[e._id?.toString()] || "Unknown",
      uses: e.uses,
      savings: formatEur(e.savings),
    })),
    usageChart: byCode.map((c) => ({ name: c._id || "—", value: c.uses })),
    savingsTrend: trend.map((t) => ({ date: t._id, value: t.savings })),
    topCodes: byCode.slice(0, 10),
  };
}

export async function getUserGrowthAnalytics(params = {}) {
  const { from, to, prevFrom, prevTo } = parseReportDateRange(params);
  const monthStart = startOfMonth(new Date());

  const [
    totalUsers,
    verifiedUsers,
    newInRange,
    prevNewInRange,
    newThisMonth,
    withMembership,
    withTickets,
    withDonations,
    trend,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isVerified: true }),
    User.countDocuments(dateMatch("createdAt", from, to)),
    User.countDocuments(dateMatch("createdAt", prevFrom, prevTo)),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    User.countDocuments({}).then(async (total) => {
      const memberEmails = await Member.distinct("email");
      return User.countDocuments({ email: { $in: memberEmails } });
    }),
    TicketOrder.distinct("userId", { userId: { $ne: null } }).then((ids) => ids.length),
    Donation.distinct("email", { paymentStatus: "paid", email: { $ne: "" } }).then((e) => e.length),
    User.aggregate([
      { $match: dateMatch("createdAt", from, to) },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    dateRange: { from, to },
    summary: {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      newInRange,
      newThisMonth,
      change: pctChange(newInRange, prevNewInRange),
      usersWithMembership: withMembership,
      usersWithTickets: withTickets,
      usersWithDonations: withDonations,
    },
    registrationTrend: trend.map((t) => ({ date: t._id, value: t.count })),
    verifiedSplit: [
      { name: "Verified", value: verifiedUsers },
      { name: "Unverified", value: Math.max(0, totalUsers - verifiedUsers) },
    ],
  };
}

export async function getCheckInAnalytics(params = {}) {
  const { from, to } = parseReportDateRange(params);

  const [totalCheckIns, byEvent, trend, ttCheckIns] = await Promise.all([
    Ticket.countDocuments({ checkedIn: true, ...dateMatch("checkedInAt", from, to) }),
    Ticket.aggregate([
      { $match: { checkedIn: true, ...dateMatch("checkedInAt", from, to) } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    dailySparkline(Ticket, "checkedInAt", from, to),
    TicketTailorBooking.countDocuments({ checkedIn: true }),
  ]);

  const soldInRange = await Ticket.countDocuments({
    status: "valid",
    ...dateMatch("createdAt", from, to),
  });
  const checkedInSold = await Ticket.countDocuments({
    checkedIn: true,
    status: "valid",
    ...dateMatch("createdAt", from, to),
  });

  const eventIds = byEvent.map((e) => e._id).filter(Boolean);
  const events = await Event.find({ _id: { $in: eventIds } }).select("title").lean();
  const eventMap = Object.fromEntries(events.map((e) => [e._id.toString(), e.title]));

  return {
    dateRange: { from, to },
    summary: {
      totalCheckIns,
      ticketTailorCheckIns: ttCheckIns,
      checkInRate: soldInRange ? Math.round((checkedInSold / soldInRange) * 100) : 0,
      noShowRate: soldInRange ? Math.round(((soldInRange - checkedInSold) / soldInRange) * 100) : 0,
    },
    byEvent: byEvent.map((e) => ({
      event: eventMap[e._id?.toString()] || "Unknown",
      checkIns: e.count,
    })),
    checkInTrend: trend.map((t) => ({ date: t.date, value: t.count })),
    eventChart: byEvent.map((e) => ({
      name: eventMap[e._id?.toString()] || "Unknown",
      value: e.count,
    })),
  };
}

export async function getFinanceAnalytics(params = {}) {
  const { from, to } = parseReportDateRange(params);
  const stats = await getFinanceDashboardStats();

  const [incomeExpenseTrend, overdueInvoices, budgetVariance, auditSummary] = await Promise.all([
    FinanceTransaction.aggregate([
      { $match: dateMatch("transactionDate", from, to) },
      {
        $group: {
          _id: { type: "$type", month: { $dateToString: { format: "%Y-%m", date: "$transactionDate" } } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]),
    Invoice.find({ paymentStatus: { $in: ["overdue", "sent", "viewed"] } })
      .sort({ dueDate: 1 })
      .limit(15)
      .select("invoiceNumber clientName totalAmount paymentStatus dueDate")
      .lean(),
    EventBudget.aggregate([
      { $match: { status: { $in: ["approved", "in_progress", "finalized"] } } },
      {
        $project: {
          eventId: 1,
          plannedIncome: { $sum: "$incomeLines.plannedAmount" },
          actualIncome: { $sum: "$incomeLines.actualAmount" },
          plannedExpense: { $sum: "$expenseLines.plannedAmount" },
          actualExpense: { $sum: "$expenseLines.actualAmount" },
        },
      },
      { $limit: 10 },
    ]),
    FinanceAuditLog.aggregate([
      { $match: dateMatch("createdAt", from, to) },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const months = [...new Set(incomeExpenseTrend.map((r) => r._id.month))].sort();
  const incomeVsExpenses = months.map((month) => {
    const income = incomeExpenseTrend
      .filter((r) => r._id.month === month && r._id.type === "income")
      .reduce((s, r) => s + r.total, 0);
    const expense = incomeExpenseTrend
      .filter((r) => r._id.month === month && r._id.type === "expense")
      .reduce((s, r) => s + r.total, 0);
    return { month, income, expense, net: income - expense };
  });

  return {
    dateRange: { from, to },
    summary: stats,
    incomeVsExpenses,
    netTrend: incomeVsExpenses.map((m) => ({
      period: m.month,
      net: m.net,
      netFormatted: formatEur(m.net),
    })),
    overdueInvoices: overdueInvoices.map((i) => ({
      invoiceNumber: i.invoiceNumber,
      client: i.clientName,
      amount: formatEur(i.totalAmount),
      status: i.paymentStatus,
      dueDate: i.dueDate,
    })),
    budgetVariance,
    auditSummary: auditSummary.map((a) => ({ action: a._id, count: a.count })),
  };
}

export async function getReportsOverview(params = {}) {
  const { from, to, prevFrom, prevTo } = parseReportDateRange(params);

  const [
    ticketStats,
    ttStats,
    payments,
    prevPayments,
    ticketRevenue,
    prevTicketRevenue,
    members,
    prevMembers,
    activeMembers,
    newMembersMonth,
    sponsorshipStats,
    donationStats,
    checkIns,
    prevCheckIns,
    discountUses,
    refunds,
    users,
    newUsers,
    revenueSparkline,
  ] = await Promise.all([
    getTicketStats(),
    getTicketTailorStats(),
    sumPaymentTransactions(dateMatch("paidAt", from, to)),
    sumPaymentTransactions(dateMatch("paidAt", prevFrom, prevTo)),
    TicketOrder.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("createdAt", from, to) } },
      { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
    ]),
    TicketOrder.aggregate([
      { $match: { paymentStatus: "paid", ...dateMatch("createdAt", prevFrom, prevTo) } },
      { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
    ]),
    Member.countDocuments(dateMatch("createdAt", from, to)),
    Member.countDocuments(dateMatch("createdAt", prevFrom, prevTo)),
    Member.countDocuments({ membershipStatus: "active" }),
    Member.countDocuments({ createdAt: { $gte: startOfMonth(new Date()) } }),
    getSponsorshipDashboardStats(),
    getDonationDashboardStats(),
    Ticket.countDocuments({ checkedIn: true, ...dateMatch("checkedInAt", from, to) }),
    Ticket.countDocuments({ checkedIn: true, ...dateMatch("checkedInAt", prevFrom, prevTo) }),
    DiscountUsage.countDocuments(dateMatch("usedAt", from, to)),
    Ticket.countDocuments({ status: "refunded", ...dateMatch("updatedAt", from, to) }),
    User.countDocuments({}),
    User.countDocuments(dateMatch("createdAt", from, to)),
    dailySparkline(PaymentTransaction, "paidAt", from, to, "amountMinor"),
  ]);

  const ticketMinor = ticketRevenue[0]?.total || 0;
  const prevTicketMinor = prevTicketRevenue[0]?.total || 0;
  const totalMinor = ticketMinor + ttStats.totalRevenueMinor + payments.total;
  const prevTotalMinor = prevTicketMinor + prevPayments.total;

  const paidOrders = await TicketOrder.countDocuments({
    paymentStatus: { $in: ["paid", "free"] },
    ...dateMatch("createdAt", from, to),
  });
  const conversions = await TicketOrder.countDocuments(dateMatch("createdAt", from, to));
  const conversionRate = conversions ? Math.round((paidOrders / conversions) * 100) : 0;

  const cards = [
    metricCard("Total Revenue", totalMinor, prevTotalMinor, revenueSparkline, "currency"),
    metricCard("Ticket Revenue", ticketMinor, prevTicketMinor, [], "currency"),
    metricCard("Membership Revenue", payments.membership, prevPayments.membership, [], "currency"),
    metricCard("Sponsorship Revenue", payments.sponsorship, prevPayments.sponsorship, [], "currency"),
    metricCard("Donation Revenue", payments.donation, prevPayments.donation, [], "currency"),
    metricCard("Total Tickets Sold", ticketStats.totalTicketsSold, ticketStats.totalTicketsSold),
    metricCard("Total Members", await Member.countDocuments({}), await Member.countDocuments({})),
    metricCard("New Members This Month", newMembersMonth, 0),
    metricCard("Active Members", activeMembers, activeMembers),
    metricCard("Event Attendance", paidOrders, paidOrders),
    metricCard("Check-ins", checkIns, prevCheckIns),
    metricCard("Conversion Rate", conversionRate, 0),
    metricCard("Refunds", refunds, 0),
    metricCard("Discounts Used", discountUses, 0),
  ];

  return {
    dateRange: { from, to, preset: params.preset || "last30" },
    cards,
    totals: {
      totalUsers: users,
      newUsers,
      sponsorshipStats,
      donationStats,
      ticketTailor: ttStats,
    },
  };
}

const CUSTOM_SOURCE_MAP = {
  events: { model: Event, dateField: "createdAt" },
  tickets: { model: TicketOrder, dateField: "createdAt" },
  tickettailor_tickets: { model: TicketTailorBooking, dateField: "createdAt" },
  memberships: { model: Member, dateField: "createdAt" },
  users: { model: User, dateField: "createdAt" },
  sponsorships: { model: Sponsorship, dateField: "createdAt" },
  donations: { model: Donation, dateField: "createdAt" },
  discounts: { model: DiscountUsage, dateField: "usedAt" },
  finance_transactions: { model: FinanceTransaction, dateField: "transactionDate" },
  invoices: { model: Invoice, dateField: "invoiceDate" },
  checkins: { model: Ticket, dateField: "checkedInAt", extra: { checkedIn: true } },
  audit_logs: { model: FinanceAuditLog, dateField: "createdAt" },
};

export async function generateCustomReport(body = {}) {
  const { from, to } = parseReportDateRange(body);
  const source = body.dataSource || "tickets";
  const config = CUSTOM_SOURCE_MAP[source];
  if (!config) {
    const err = new Error("Unknown data source.");
    err.status = 400;
    throw err;
  }

  const filter = { ...dateMatch(config.dateField, from, to), ...(config.extra || {}) };
  if (body.filters?.paymentStatus) filter.paymentStatus = body.filters.paymentStatus;
  if (body.filters?.status) filter.status = body.filters.status;
  if (body.filters?.eventId) filter.eventId = body.filters.eventId;

  const limit = Math.min(Number(body.limit) || 500, 2000);
  const docs = await config.model.find(filter).sort({ [config.dateField]: -1 }).limit(limit).lean();

  const fields = body.selectedFields?.length
    ? body.selectedFields
    : Object.keys(docs[0] || {}).slice(0, 12);

  const rows = docs.map((doc) => {
    const row = {};
    fields.forEach((f) => {
      const val = doc[f];
      row[f] = val instanceof Date ? val.toISOString() : val?._id ? val._id.toString() : val;
    });
    return row;
  });

  let chartData = [];
  const groupBy = body.groupBy;
  if (groupBy === "date" || groupBy === "month") {
    const fmt = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";
    const grouped = await config.model.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: `$${config.dateField}` } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    chartData = grouped.map((g) => ({ name: g._id, value: g.count }));
  }

  return {
    dateRange: { from, to },
    dataSource: source,
    chartType: body.chartType || "table",
    groupBy,
    columns: fields,
    rows,
    chartData,
    total: rows.length,
  };
}

export async function nextReportPublicId(prefix) {
  const seq = await getNextSequence(prefix);
  const year = new Date().getFullYear();
  return `${prefix.toUpperCase()}-${year}-${String(seq).padStart(6, "0")}`;
}
