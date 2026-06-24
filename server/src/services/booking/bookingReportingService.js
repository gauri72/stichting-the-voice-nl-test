import CheckoutAuditLog from "../../models/CheckoutAuditLog.js";
import ActivityLog from "../../models/ActivityLog.js";
import WaitlistEntry from "../../models/WaitlistEntry.js";
import TicketOrder from "../../models/TicketOrder.js";
import CheckoutFormResponse from "../../models/CheckoutFormResponse.js";
import { CHECKOUT_AUDIT_ACTIONS } from "../checkoutAuditService.js";
import { parseReportDateRange } from "../reportAnalyticsService.js";

function formatEur(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    Number(minor || 0) / 100
  );
}

export async function getBookingEngineAnalytics(params = {}) {
  const { from, to } = parseReportDateRange(params);
  const dateFilter = { $gte: from, $lte: to };

  const [
    checkoutAudits,
    activityLogs,
    waitlistEntries,
    complimentaryOrders,
    freeOrders,
    formResponses,
    ordersByMode,
  ] = await Promise.all([
    CheckoutAuditLog.find({ createdAt: dateFilter }).sort({ createdAt: -1 }).limit(500).lean(),
    ActivityLog.find({
      createdAt: dateFilter,
      kind: {
        $in: [
          "booking_started",
          "booking_completed",
          "ticket_purchased",
          "rsvp_submitted",
          "session_booked",
          "waitlist_joined",
          "membership_detected",
          "payment_completed",
        ],
      },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    WaitlistEntry.find({ createdAt: dateFilter }).lean(),
    TicketOrder.countDocuments({ createdAt: dateFilter, paymentStatus: "complimentary" }),
    TicketOrder.countDocuments({ createdAt: dateFilter, paymentStatus: { $in: ["free", "complimentary"] } }),
    CheckoutFormResponse.countDocuments({ createdAt: dateFilter }),
    TicketOrder.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: "$bookingMode", count: { $sum: 1 }, revenue: { $sum: "$totalAmountMinor" } } },
    ]),
  ]);

  const auditActionCounts = checkoutAudits.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {});

  const activityByKind = activityLogs.reduce((acc, row) => {
    acc[row.kind] = (acc[row.kind] || 0) + 1;
    return acc;
  }, {});

  const waitlistByStatus = waitlistEntries.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  const funnel = {
    previews: auditActionCounts[CHECKOUT_AUDIT_ACTIONS.PRICE_PREVIEW_GENERATED] || 0,
    checkoutsStarted: auditActionCounts[CHECKOUT_AUDIT_ACTIONS.CHECKOUT_PAYMENT_STARTED] || 0,
    ordersCreated: auditActionCounts[CHECKOUT_AUDIT_ACTIONS.COMBINED_ORDER_CREATED] || 0,
    completed: auditActionCounts[CHECKOUT_AUDIT_ACTIONS.CHECKOUT_COMPLETED] || 0,
    freeCompleted: auditActionCounts[CHECKOUT_AUDIT_ACTIONS.FREE_ORDER_COMPLETED] || 0,
  };

  return {
    summary: {
      checkoutAuditEvents: checkoutAudits.length,
      userActivityEvents: activityLogs.length,
      waitlistJoins: waitlistEntries.length,
      complimentaryTickets: complimentaryOrders,
      freeRegistrations: freeOrders,
      formResponses,
      memberBookings: activityByKind.membership_detected || 0,
      rsvpSubmissions: activityByKind.rsvp_submitted || 0,
      sessionBookings: activityByKind.session_booked || 0,
    },
    funnel,
    waitlistByStatus,
    activityByKind,
    ordersByMode: ordersByMode.map((r) => ({
      mode: r._id || "standard",
      count: r.count,
      revenueFormatted: formatEur(r.revenue),
    })),
    recentAudit: checkoutAudits.slice(0, 25).map((a) => ({
      action: a.action,
      email: a.email,
      orderId: a.orderId,
      createdAt: a.createdAt,
    })),
    recentActivity: activityLogs.slice(0, 25).map((a) => ({
      kind: a.kind,
      summary: a.summary,
      createdAt: a.createdAt,
    })),
  };
}
