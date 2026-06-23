import User from "../models/User.js";
import Membership from "../models/Membership.js";
import Donation from "../models/Donation.js";
import TicketOrder from "../models/TicketOrder.js";

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function insight(id, title, body, trend = "neutral", metric = "") {
  return { id, title, body, trend, metric };
}

export async function generateDashboardInsights({ overview, ticketStats, finance, donations, sponsorships } = {}) {
  const insights = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  try {
    const [membersRecent, membersPrior, donationsRecent, donationsPrior, ordersRecent, ordersPrior] =
      await Promise.all([
        Membership.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Membership.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
        Donation.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, paymentStatus: "paid" }),
        Donation.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, paymentStatus: "paid" }),
        TicketOrder.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, status: "paid" }),
        TicketOrder.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, status: "paid" }),
      ]);

    const memberGrowth = pctChange(membersRecent, membersPrior);
    insights.push(
      insight(
        "membership-growth",
        "Membership growth trend",
        memberGrowth >= 0
          ? `Membership sign-ups grew ${memberGrowth}% vs the prior 30 days (${membersRecent} new).`
          : `Membership sign-ups declined ${Math.abs(memberGrowth)}% vs the prior 30 days.`,
        memberGrowth > 0 ? "up" : memberGrowth < 0 ? "down" : "flat",
        `${membersRecent} new`
      )
    );

    const donationGrowth = pctChange(donationsRecent, donationsPrior);
    insights.push(
      insight(
        "donation-growth",
        "Donation activity",
        donationGrowth >= 0
          ? `Paid donations increased ${donationGrowth}% compared to the previous month.`
          : `Paid donations decreased ${Math.abs(donationGrowth)}% compared to the previous month.`,
        donationGrowth > 0 ? "up" : donationGrowth < 0 ? "down" : "flat",
        donations?.donationRevenue || ""
      )
    );

    const ticketGrowth = pctChange(ordersRecent, ordersPrior);
    insights.push(
      insight(
        "ticket-forecast",
        "Ticket sales forecast",
        ticketGrowth > 10
          ? `Strong ticket momentum (+${ticketGrowth}%). Consider promoting upcoming events.`
          : ticketGrowth < -10
            ? `Ticket orders are down ${Math.abs(ticketGrowth)}%. Review pricing and marketing.`
            : `Ticket sales are stable (${ordersRecent} orders in the last 30 days).`,
        ticketGrowth > 0 ? "up" : ticketGrowth < 0 ? "down" : "flat",
        ticketStats?.totalTicketsSold != null ? `${ticketStats.totalTicketsSold} sold` : ""
      )
    );
  } catch {
    // non-fatal
  }

  if (sponsorships?.followUpsDue > 0) {
    insights.push(
      insight(
        "sponsor-opportunity",
        "Sponsorship opportunity",
        `${sponsorships.followUpsDue} sponsor follow-ups are due. Prioritise outreach this week.`,
        "neutral",
        `${sponsorships.activeSponsorships || 0} active`
      )
    );
  }

  if (finance?.netResult) {
    insights.push(
      insight(
        "revenue-trend",
        "Revenue trends",
        `Net result is ${finance.netResult} with ${finance.pendingInvoices || 0} pending invoices.`,
        "neutral",
        finance.totalIncome || ""
      )
    );
  }

  if (overview?.totalUsers && overview?.verifiedUsers) {
    const verifyRate = Math.round((overview.verifiedUsers / overview.totalUsers) * 100);
    insights.push(
      insight(
        "user-verification",
        "User engagement",
        `${verifyRate}% of registered users are verified (${overview.verifiedUsers}/${overview.totalUsers}).`,
        verifyRate > 70 ? "up" : "neutral"
      )
    );
  }

  return insights.slice(0, 6);
}
