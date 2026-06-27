import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import AIBookingLog from "../models/AIBookingLog.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import TicketOrder from "../models/TicketOrder.js";
import { getStripe, isStripeConfigured } from "./stripe.js";
import { creditWallet, debitWallet, getGlobalSettings as getWalletGlobalSettings } from "./walletService.js";
import WalletGlobalSettings from "../models/WalletGlobalSettings.js";

function err(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export async function listWallets({ search = "", limit = 100 } = {}) {
  const wallets = await Wallet.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
  const userIds = wallets.map((w) => w.customerId);
  const users = await User.find({ _id: { $in: userIds } }).select("firstName lastName email").lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const needle = search.trim().toLowerCase();
  return wallets
    .map((w) => {
      const user = userMap.get(w.customerId.toString());
      return {
        customerId: w.customerId.toString(),
        name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
        email: user?.email || "",
        balanceMinor: w.balanceMinor,
        rewardPoints: w.rewardPoints,
        totalEarnedMinor: w.totalEarnedMinor,
        totalSpentMinor: w.totalSpentMinor,
      };
    })
    .filter((w) => !needle || w.name.toLowerCase().includes(needle) || w.email.toLowerCase().includes(needle));
}

export async function listTransactionsForAdmin({ customerId, type, limit = 100 } = {}) {
  const query = {};
  if (customerId) query.customerId = customerId;
  if (type) query.type = type;
  const transactions = await WalletTransaction.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  const userIds = [...new Set(transactions.map((t) => t.customerId.toString()))];
  const users = await User.find({ _id: { $in: userIds } }).select("firstName lastName email").lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  return transactions.map((t) => {
    const user = userMap.get(t.customerId.toString());
    return {
      id: t._id.toString(),
      customerName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      customerEmail: user?.email || "",
      type: t.type,
      amountMinor: t.amountMinor,
      points: t.points,
      description: t.description,
      initiatedBy: t.initiatedBy,
      status: t.status,
      createdAt: t.createdAt,
    };
  });
}

export async function adminCreditWallet(customerId, amountMinor, reason, adminId) {
  if (!reason?.trim()) throw err("A reason is required for manual wallet credits.");
  return creditWallet(customerId, amountMinor, {
    type: "adminCredit",
    description: reason.trim(),
    referenceType: "admin",
    referenceId: adminId?.toString() || "",
    initiatedBy: "admin",
    allowOverCap: true,
  });
}

export async function adminDebitWallet(customerId, amountMinor, reason, adminId) {
  if (!reason?.trim()) throw err("A reason is required for manual wallet debits.");
  return debitWallet(customerId, amountMinor, {
    type: "adminDebit",
    description: reason.trim(),
    referenceType: "admin",
    referenceId: adminId?.toString() || "",
    initiatedBy: "admin",
  });
}

export async function adminAdjustPoints(customerId, points, reason, adminId) {
  if (!reason?.trim()) throw err("A reason is required for manual points adjustments.");
  if (!Number.isInteger(points) || points === 0) throw err("Points adjustment must be a non-zero integer.");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { customerId },
      { $inc: { rewardPoints: points } },
      { new: true, upsert: true, session }
    );
    if (wallet.rewardPoints < 0) {
      wallet.rewardPoints = 0;
      await wallet.save({ session });
    }
    const [transaction] = await WalletTransaction.create(
      [
        {
          customerId,
          type: points > 0 ? "adminCredit" : "adminDebit",
          points,
          description: reason.trim(),
          referenceType: "admin",
          referenceId: adminId?.toString() || "",
          initiatedBy: "admin",
        },
      ],
      { session }
    );
    await session.commitTransaction();
    return { wallet, transaction };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function getGlobalSettings() {
  return getWalletGlobalSettings();
}

export async function updateGlobalSettings(updates) {
  const settings = await getWalletGlobalSettings();
  const allowed = [
    "enabled",
    "maxWalletBalanceMinor",
    "twoFactorTopUpThresholdMinor",
    "pointsPerEuroSpent",
    "minRedemptionPoints",
    "pointsNeededPerEuroDiscount",
    "pointsExpiryDays",
  ];
  for (const key of allowed) {
    if (updates[key] !== undefined) settings[key] = updates[key];
  }
  if (updates.bonusMultipliers) {
    settings.bonusMultipliers = { ...settings.bonusMultipliers.toObject(), ...updates.bonusMultipliers };
  }
  await settings.save();
  return settings;
}

export async function listAiBookingsForAdmin({ limit = 100 } = {}) {
  const logs = await AIBookingLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  const userIds = [...new Set(logs.map((l) => l.customerId.toString()))];
  const eventIds = [...new Set(logs.map((l) => l.eventId?.toString()).filter(Boolean))];
  const [users, events] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("firstName lastName email").lean(),
    Event.find({ _id: { $in: eventIds } }).select("title").lean(),
  ]);
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

  return logs.map((l) => {
    const user = userMap.get(l.customerId.toString());
    const event = eventMap.get(l.eventId?.toString());
    return {
      id: l._id.toString(),
      customerName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
      customerEmail: user?.email || "",
      prompt: l.prompt,
      eventTitle: event?.title || "",
      quantity: l.quantity,
      totalAmountMinor: l.totalAmountMinor,
      status: l.status,
      confirmedAt: l.confirmedAt,
      createdAt: l.createdAt,
    };
  });
}

export async function getWalletAnalytics({ from, to } = {}) {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  const match = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [byType, aiBookingsCount, aiBookingsTotal, activeWallets] = await Promise.all([
    WalletTransaction.aggregate([
      { $match: match },
      { $group: { _id: "$type", count: { $sum: 1 }, totalMinor: { $sum: { $abs: "$amountMinor" } }, totalPoints: { $sum: { $abs: "$points" } } } },
    ]),
    AIBookingLog.countDocuments({ ...match, status: "confirmed" }),
    AIBookingLog.aggregate([
      { $match: { ...match, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$totalAmountMinor" } } },
    ]),
    Wallet.countDocuments({ balanceMinor: { $gt: 0 } }),
  ]);

  const breakdown = {};
  for (const row of byType) breakdown[row._id] = { count: row.count, totalMinor: row.totalMinor, totalPoints: row.totalPoints };

  return {
    breakdown,
    aiBookings: { count: aiBookingsCount, totalMinor: aiBookingsTotal[0]?.total || 0 },
    activeWallets,
    topUpRevenueMinor: breakdown.topup?.totalMinor || 0,
    purchaseVolumeMinor: breakdown.purchase?.totalMinor || 0,
  };
}

export async function refundOrder(orderId, { method = "wallet", reason = "" } = {}, adminId) {
  const order = await TicketOrder.findById(orderId);
  if (!order) throw err("Order not found.", 404);
  if (order.paymentStatus === "refunded") throw err("This order has already been refunded.");

  if (method === "original" && order.paymentIntentId && isStripeConfigured()) {
    const stripe = getStripe();
    await stripe.refunds.create({ payment_intent: order.paymentIntentId });
  } else if (order.userId) {
    await creditWallet(order.userId, order.totalAmountMinor, {
      type: "refund",
      description: reason || `Refund for order ${order.orderNumber}`,
      referenceType: "ticketOrder",
      referenceId: order._id.toString(),
      initiatedBy: "admin",
      allowOverCap: true,
    });
  } else {
    throw err("This order has no associated customer account to refund to a wallet, and no original payment method to refund to.");
  }

  order.paymentStatus = "refunded";
  order.orderStatus = "CANCELLED";
  await order.save();
  return { success: true, order };
}
