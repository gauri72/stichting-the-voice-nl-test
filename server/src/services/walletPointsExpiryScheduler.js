import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

const TICK_MS = 24 * 60 * 60 * 1000; // once a day is plenty for points that expire in months

let timer = null;
let running = false;

async function expirePointsForCustomer(customerId, expiredRows) {
  const totalPoints = expiredRows.reduce((sum, r) => sum + r.points, 0);
  if (totalPoints <= 0) return 0;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { customerId },
      { $inc: { rewardPoints: -totalPoints } },
      { new: true, upsert: true, session }
    );
    if (wallet.rewardPoints < 0) {
      wallet.rewardPoints = 0;
      await wallet.save({ session });
    }
    await WalletTransaction.updateMany(
      { _id: { $in: expiredRows.map((r) => r._id) } },
      { $set: { expired: true } },
      { session }
    );
    await WalletTransaction.create(
      [
        {
          customerId,
          type: "pointsExpired",
          points: -totalPoints,
          description: `${totalPoints} points expired`,
          initiatedBy: "customer",
        },
      ],
      { session }
    );
    await session.commitTransaction();
    return totalPoints;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

async function runOnce(reason) {
  if (running) return;
  running = true;
  try {
    const expiredRows = await WalletTransaction.find({
      type: "pointsEarned",
      expired: false,
      expiresAt: { $lte: new Date() },
    }).lean();

    const byCustomer = new Map();
    for (const row of expiredRows) {
      const key = row.customerId.toString();
      if (!byCustomer.has(key)) byCustomer.set(key, []);
      byCustomer.get(key).push(row);
    }

    let totalExpired = 0;
    for (const [customerId, rows] of byCustomer) {
      totalExpired += await expirePointsForCustomer(customerId, rows);
    }
    console.log(`[wallet] points expiry (${reason}): ${byCustomer.size} customers, ${totalExpired} points expired.`);
  } catch (err) {
    console.warn(`[wallet] points expiry (${reason}) failed: ${err.message}`);
  } finally {
    running = false;
  }
}

export function startWalletPointsExpiryScheduler() {
  runOnce("startup");
  timer = setInterval(() => runOnce("interval"), TICK_MS);
  if (typeof timer.unref === "function") timer.unref();
  console.log("[wallet] points expiry scheduler started (every 24h).");
}
