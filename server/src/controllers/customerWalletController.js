import {
  getWalletSummary,
  listTransactions,
  previewPointsRedemption,
  getOrCreateWalletSettings,
} from "../services/walletService.js";
import { createTopUpPaymentIntent } from "../services/walletTopUpService.js";
import { payTicketWithWallet, payTicketSplit } from "../services/walletCheckoutService.js";
import { executeWalletBooking } from "../services/walletAiBookingService.js";
import AIBookingLog from "../models/AIBookingLog.js";
import WalletSettings from "../models/WalletSettings.js";

function handleError(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[wallet]", error);
  return res.status(status).json({ error: error.message || "Request failed." });
}

export async function getWallet(req, res) {
  try {
    const summary = await getWalletSummary(req.user.id);
    return res.json(summary);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTransactions(req, res) {
  try {
    const transactions = await listTransactions(req.user.id, { limit: Number(req.query.limit) || 50, before: req.query.before });
    return res.json({ transactions });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postTopUp(req, res) {
  try {
    const { amountMinor, otp, clientRequestId } = req.body || {};
    const result = await createTopUpPaymentIntent(req.user.id, { amountMinor: Number(amountMinor), otp, clientRequestId });
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postPay(req, res) {
  try {
    const { eventId, checkout, pointsToRedeem, split } = req.body || {};
    if (!eventId || !checkout) return res.status(400).json({ error: "eventId and checkout payload are required." });

    if (split?.walletPortionMinor) {
      const result = await payTicketSplit(eventId, checkout, req.user.id, {
        walletPortionMinor: Number(split.walletPortionMinor),
        pointsToRedeem: Number(pointsToRedeem) || 0,
      });
      return res.status(201).json(result);
    }

    const result = await payTicketWithWallet(eventId, checkout, req.user.id, { pointsToRedeem: Number(pointsToRedeem) || 0 });
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postRedeemPointsPreview(req, res) {
  try {
    const { points } = req.body || {};
    const preview = await previewPointsRedemption(req.user.id, Number(points));
    return res.json(preview);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function putSettings(req, res) {
  try {
    const settings = await getOrCreateWalletSettings(req.user.id);
    const allowed = [
      "aiBookingEnabled",
      "maxAISpendPerTransactionMinor",
      "dailyAISpendLimitMinor",
      "lowBalanceThresholdMinor",
      "confirmationStepEnabled",
      "defaultTopUpAmountMinor",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) settings[key] = req.body[key];
    }
    await settings.save();
    return res.json({ settings });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function postRevokeAiBooking(req, res) {
  try {
    await WalletSettings.findOneAndUpdate({ customerId: req.user.id }, { aiBookingEnabled: false }, { upsert: true });
    return res.json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}

/** Lets the chat UI offer a "Confirm Booking" button instead of requiring the customer to type "yes". */
export async function postConfirmAiBooking(req, res) {
  try {
    const { bookingIntentId } = req.body || {};
    if (!bookingIntentId) return res.status(400).json({ error: "bookingIntentId is required." });
    const result = await executeWalletBooking(req.user.id, { bookingIntentId });
    if (result?.error) return res.status(400).json({ error: result.error });
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getAiBookings(req, res) {
  try {
    const logs = await AIBookingLog.find({ customerId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    return res.json({
      bookings: logs.map((l) => ({
        id: l._id.toString(),
        eventId: l.eventId,
        quantity: l.quantity,
        totalAmountMinor: l.totalAmountMinor,
        status: l.status,
        confirmedAt: l.confirmedAt,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    return handleError(res, error);
  }
}
