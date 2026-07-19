import BusinessOrder from "../models/BusinessOrder.js";
import BusinessProfile from "../models/BusinessProfile.js";
import BusinessStripePayout from "../models/BusinessStripePayout.js";
import { syncConnectedAccount } from "./businessConnectService.js";

function unixDate(value) {
  return value ? new Date(Number(value) * 1000) : null;
}

export async function handleConnectedAccountEvent(event) {
  if (event.type === "account.updated") {
    return syncConnectedAccount(event.data.object);
  }
  if (!event.account) return null;
  const business = await BusinessProfile.findOne({ stripeConnectedAccountId: event.account });
  if (!business) return null;
  business.stripeLastSyncedAt = new Date();
  await business.save();
  return business;
}

export async function handleConnectedPayoutEvent(event) {
  const payout = event.data.object;
  const accountId = event.account || payout.destination || "";
  if (!payout?.id || !accountId) return null;
  const business = await BusinessProfile.findOne({ stripeConnectedAccountId: accountId }).lean();
  const destination = payout.destination && typeof payout.destination === "object"
    ? payout.destination : null;
  return BusinessStripePayout.findOneAndUpdate(
    { stripePayoutId: payout.id },
    {
      stripePayoutId: payout.id,
      stripeConnectedAccountId: accountId,
      businessId: business?._id || null,
      amountMinor: Number(payout.amount || 0),
      currency: payout.currency || "eur",
      status: payout.status || event.type.replace("payout.", ""),
      method: payout.method || "standard",
      arrivalDate: unixDate(payout.arrival_date),
      failureCode: payout.failure_code || "",
      failureMessage: payout.failure_message || "",
      bankName: destination?.bank_name || "",
      bankLast4: destination?.last4 || "",
      rawSnapshot: {
        automatic: payout.automatic,
        created: payout.created,
        type: payout.type,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function handleBusinessDisputeEvent(event) {
  const dispute = event.data.object;
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return null;
  const status = event.type === "charge.dispute.closed"
    ? (dispute.status === "won" ? "won" : "lost")
    : "open";
  return BusinessOrder.findOneAndUpdate(
    { stripeChargeId: chargeId },
    {
      stripeDisputeId: dispute.id,
      disputeStatus: status,
      disputedAt: new Date(),
      payoutHoldReason: status === "open" ? `Stripe dispute ${dispute.id} is open.` : "",
    },
    { new: true }
  );
}

export async function handleExternalBusinessRefund(event) {
  const charge = event.data.object;
  const chargeId = charge?.id;
  if (!chargeId || !charge.refunded) return null;
  return BusinessOrder.findOneAndUpdate(
    { stripeChargeId: chargeId, status: { $ne: "refunded" } },
    {
      status: "refunded",
      paymentStatus: "refunded",
      refundedAt: new Date(),
      payoutHoldReason: "Refund was initiated outside V.Commerce; reconcile inventory and ledger.",
    },
    { new: true }
  );
}
