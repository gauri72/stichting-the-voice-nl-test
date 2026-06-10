import User from "../models/User.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import ActivityLog from "../models/ActivityLog.js";

function formatEur(minor) {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      Number(minor) / 100
    );
  } catch {
    return `€${(Number(minor) / 100).toFixed(2)}`;
  }
}

export async function getAdminDashboardPayload(admin) {
  const [
    totalUsers,
    verifiedUsers,
    totalMembers,
    activeMemberships,
    paymentStats,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isVerified: true }),
    Member.countDocuments({}),
    Membership.countDocuments({ active: true }),
    PaymentTransaction.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalMinor: { $sum: "$amountMinor" },
        },
      },
    ]),
    ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("userId", "firstName lastName email")
      .lean(),
  ]);

  const paidSummary = paymentStats[0] || { count: 0, totalMinor: 0 };

  return {
    admin,
    overview: {
      totalUsers,
      verifiedUsers,
      totalMembers,
      activeMemberships,
      totalPayments: paidSummary.count,
      totalRevenue: formatEur(paidSummary.totalMinor),
    },
    recentActivity: recentActivity.map((entry) => ({
      id: entry._id.toString(),
      kind: entry.kind,
      summary: entry.summary,
      detail: entry.detail,
      createdAt: entry.createdAt,
      user: entry.userId
        ? {
            id: entry.userId._id.toString(),
            firstName: entry.userId.firstName,
            lastName: entry.userId.lastName,
            email: entry.userId.email,
          }
        : null,
    })),
  };
}
