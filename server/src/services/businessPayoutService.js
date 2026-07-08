import BusinessOrder from "../models/BusinessOrder.js";
import BusinessPayout from "../models/BusinessPayout.js";
import BusinessProfile from "../models/BusinessProfile.js";

export async function createPayout(adminId, businessId, orderIds) {
  const business = await BusinessProfile.findById(businessId).lean();
  if (!business) {
    const err = new Error("Business not found.");
    err.status = 404;
    throw err;
  }

  // Validate all orders exist, belong to business, are paid, and not yet in a payout
  const orders = await BusinessOrder.find({
    _id: { $in: orderIds },
    businessId,
    status: "paid",
    payoutId: null,
  }).lean();

  if (orders.length === 0) {
    const err = new Error("No eligible orders found for this payout.");
    err.status = 400;
    throw err;
  }

  const grossMinor = orders.reduce((sum, o) => sum + o.subtotalMinor, 0);
  const platformFeeMinor = orders.reduce((sum, o) => sum + o.platformFeeMinor, 0);
  const netMinor = orders.reduce((sum, o) => sum + o.businessAmountMinor, 0);

  const payout = await BusinessPayout.create({
    businessId,
    businessName: business.businessName,
    orderIds: orders.map((o) => o._id),
    orderCount: orders.length,
    grossMinor,
    platformFeeMinor,
    netMinor,
    currency: "eur",
    status: "pending",
    ibanSnapshot: business.payoutIBAN || "",
    bankHolderSnapshot: business.payoutBankHolder || "",
    createdBy: adminId,
  });

  // Link orders to the payout
  await BusinessOrder.updateMany(
    { _id: { $in: orders.map((o) => o._id) } },
    { $set: { payoutId: payout._id } }
  );

  return payout;
}

export async function markPayoutPaid(payoutId, { paymentReference, notes }) {
  const payout = await BusinessPayout.findById(payoutId);
  if (!payout) {
    const err = new Error("Payout not found.");
    err.status = 404;
    throw err;
  }
  if (payout.status === "paid") {
    const err = new Error("Payout is already marked as paid.");
    err.status = 409;
    throw err;
  }

  payout.status = "paid";
  payout.paidAt = new Date();
  payout.paymentReference = paymentReference || "";
  payout.notes = notes || "";
  await payout.save();

  // Update business lifetime payout total
  await BusinessProfile.findByIdAndUpdate(payout.businessId, {
    $inc: { totalPayoutsMinor: payout.netMinor, pendingPayoutMinor: -payout.netMinor },
  });

  return payout;
}

export async function listPayouts({ businessId, status, page = 1, pageSize = 20 } = {}) {
  const filter = {};
  if (businessId) filter.businessId = businessId;
  if (status) filter.status = status;

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessPayout.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    BusinessPayout.countDocuments(filter),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getBusinessPendingPayoutSummary(businessId) {
  const result = await BusinessOrder.aggregate([
    { $match: { businessId: new (await import("mongoose")).default.Types.ObjectId(businessId), status: "paid", payoutId: null } },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        grossMinor: { $sum: "$subtotalMinor" },
        feeMinor: { $sum: "$platformFeeMinor" },
        netMinor: { $sum: "$businessAmountMinor" },
      },
    },
  ]);
  return result[0] || { orderCount: 0, grossMinor: 0, feeMinor: 0, netMinor: 0 };
}

export async function getAdminPayoutAnalytics() {
  const mongoose = (await import("mongoose")).default;

  const [revenueByMonth, topBusinesses, orderTotals, profileTotals] = await Promise.all([
    BusinessOrder.aggregate([
      { $match: { status: { $in: ["paid", "fulfilled"] } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$subtotalMinor" },
          fees: { $sum: "$platformFeeMinor" },
          cashback: { $sum: "$cashbackMinor" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
    BusinessProfile.find({ status: "active" })
      .sort({ totalRevenueMinor: -1 })
      .limit(5)
      .select("businessName totalRevenueMinor totalOrders totalFeesMinor")
      .lean(),
    BusinessOrder.aggregate([
      { $match: { status: { $in: ["paid", "fulfilled"] } } },
      {
        $group: {
          _id: null,
          totalRevenueMinor: { $sum: "$subtotalMinor" },
          totalFeesMinor: { $sum: "$platformFeeMinor" },
          totalCashbackMinor: { $sum: "$cashbackMinor" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    BusinessProfile.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: null,
          totalPayoutsMinor: { $sum: "$totalPayoutsMinor" },
          pendingPayoutMinor: { $sum: "$pendingPayoutMinor" },
          totalActiveBusinesses: { $sum: 1 },
        },
      },
    ]),
  ]);

  const orderStats = orderTotals[0] || { totalRevenueMinor: 0, totalFeesMinor: 0, totalCashbackMinor: 0, totalOrders: 0 };
  const profileStats = profileTotals[0] || { totalPayoutsMinor: 0, pendingPayoutMinor: 0, totalActiveBusinesses: 0 };

  return {
    revenueByMonth: revenueByMonth.reverse(),
    topBusinesses,
    totals: { ...orderStats, ...profileStats },
  };
}
