import BusinessProfile from "../models/BusinessProfile.js";
import BusinessProduct from "../models/BusinessProduct.js";
import BusinessOrder from "../models/BusinessOrder.js";
import { creditWallet } from "./walletService.js";
import { applyPointsDiscount, capWalletPortion, deferWalletDebit } from "./walletSplitPaymentService.js";
import { getVCommerceStripe } from "./stripe.js";
import {
  VCOMMERCE_PLATFORM_FEE_PERCENT,
  VCOMMERCE_PAYOUT_DELAY_BUSINESS_DAYS,
} from "../config/vcommercePlans.js";
import VCommerceLedgerEntry from "../models/VCommerceLedgerEntry.js";
import { resolveOrderChargeRules } from "./vcommerceAdminOperationsService.js";
import crypto from "crypto";
import { sendBusinessOrderEmails } from "./businessOrderReceiptService.js";

export function addBusinessDays(date, count) {
  const result = new Date(date);
  let remaining = count;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

function resolveUnitPrice(product, qty) {
  const tiers = [...(product.bulkPricingTiers ?? [])].sort((a, b) => b.minQty - a.minQty);
  for (const tier of tiers) {
    if (qty >= tier.minQty) return tier.priceMinor;
  }
  return product.priceMinor;
}

export async function createOrderIntent(customerId, customerData, businessId, items, shippingAddress, { referralCode, poNumber, walletPortionMinor, pointsToRedeem } = {}) {
  const business = await BusinessProfile.findById(businessId).lean();
  if (!business || business.status !== "active") {
    const err = new Error("Business not found or not active.");
    err.status = 404;
    throw err;
  }
  if (!business.stripeConnectedAccountId || !business.connectCheckoutEnabled ||
      !business.payoutsEnabled || !business.stripeTransfersEnabled) {
    const err = new Error("This seller is temporarily unavailable for online payment while its Stripe payout account is being verified.");
    err.status = 409;
    err.code = "SELLER_PAYOUTS_NOT_READY";
    throw err;
  }

  // Validate and price each item
  const resolvedItems = [];
  let subtotalMinor = 0;

  for (const item of items) {
    const product = await BusinessProduct.findOne({
      _id: item.productId,
      businessId,
      isAvailable: true,
    }).lean();

    if (!product) {
      const err = new Error(`Product "${item.productId}" is not available.`);
      err.status = 400;
      throw err;
    }

    if (product.stockCount !== null && product.stockCount < item.quantity) {
      const err = new Error(`Insufficient stock for "${product.name}".`);
      err.status = 400;
      throw err;
    }

    // Enforce minimum order quantity
    const minQty = product.minOrderQty ?? 1;
    if (item.quantity < minQty) {
      const err = new Error(`Minimum order quantity for "${product.name}" is ${minQty}.`);
      err.status = 400;
      throw err;
    }

    const unitPrice = resolveUnitPrice(product, item.quantity);
    const lineTotal = unitPrice * item.quantity;
    subtotalMinor += lineTotal;

    resolvedItems.push({
      productId: product._id,
      productName: product.name,
      productType: product.type,
      variant: item.variant || "",
      quantity: item.quantity,
      unitPriceMinor: unitPrice,
      lineTotalMinor: lineTotal,
    });
  }

  if (subtotalMinor <= 0) {
    const err = new Error("Order total must be greater than zero.");
    err.status = 400;
    throw err;
  }

  // Enforce minimum order value per seller storefront
  if (business.minOrderValueMinor > 0 && subtotalMinor < business.minOrderValueMinor) {
    const minEur = (business.minOrderValueMinor / 100).toFixed(2);
    const err = new Error(`Minimum order value for this seller is €${minEur}.`);
    err.status = 400;
    throw err;
  }

  // Orders paid on V.Commerce use one clear marketplace rate. Businesses that
  // send customers to an external site don't create a platform order.
  const configuredRules = await resolveOrderChargeRules(business);
  const effectiveFeePercent = configuredRules.platformFee?.calculation === "percentage"
    ? configuredRules.platformFee.percent
    : business.platformFeePercent ?? VCOMMERCE_PLATFORM_FEE_PERCENT;
  const cashbackPercent = configuredRules.cashback?.calculation === "percentage"
    ? configuredRules.cashback.percent
    : business.cashbackPercent ?? 5;

  const platformFeeMinor = Math.round((subtotalMinor * effectiveFeePercent) / 100);
  const businessAmountMinor = subtotalMinor - platformFeeMinor;
  const isGuest = !customerId;

  // Optional V.Wallet balance + reward-points composition, authenticated
  // customers only (guest checkout has no wallet or points). Same order as
  // tickets/donations: points discount first, then cap the wallet portion
  // against the already-discounted amount, then Stripe covers whatever's
  // left. platformFeeMinor/businessAmountMinor above stay computed on the
  // full pre-discount subtotalMinor — the seller isn't penalized for the
  // customer's payment method or points choice — so the fee actually
  // collected gets split proportionally across the card leg (via the
  // reduced destination charge's application_fee_amount below) and the
  // wallet leg (via the payout math in settleOrderFulfillment's transfer).
  let pointsDiscountMinor = 0;
  let cappedWalletPortion = 0;
  let cardPortionMinor = subtotalMinor;
  const requestedPointsToRedeem = Number(pointsToRedeem) || 0;
  const requestedWalletPortionMinor = Number(walletPortionMinor) || 0;
  if (!isGuest && (requestedPointsToRedeem > 0 || requestedWalletPortionMinor > 0)) {
    const discount = await applyPointsDiscount(customerId, requestedPointsToRedeem, subtotalMinor);
    pointsDiscountMinor = discount.discountMinor;
    cappedWalletPortion = await capWalletPortion(customerId, requestedWalletPortionMinor, discount.amountDueMinor);
    cardPortionMinor = discount.amountDueMinor - cappedWalletPortion;
  }

  // Cashback excludes the wallet-funded portion (confirmed decision) —
  // computed on whatever's left after points + wallet, so it can't compound
  // on itself (wallet balance -> cashback -> more wallet balance -> ...).
  const cashbackMinor = Math.round((cardPortionMinor * cashbackPercent) / 100);
  const effectiveCashbackMinor = isGuest ? 0 : cashbackMinor;
  const guestAccessToken = isGuest ? crypto.randomBytes(32).toString("hex") : "";
  const guestAccessTokenHash = guestAccessToken
    ? crypto.createHash("sha256").update(guestAccessToken).digest("hex")
    : "";
  const requiresShipping = resolvedItems.some((item) => item.productType !== "service");

  // Create the Stripe PaymentIntent
  const stripe = getVCommerceStripe();

  // Create the BusinessOrder first to get its ID for metadata
  const order = await BusinessOrder.create({
    orderNumber: `VCO-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    businessId,
    customerId: customerId || null,
    checkoutMode: isGuest ? "guest" : "account",
    businessName: business.businessName,
    customerName: customerData.name || "",
    customerEmail: customerData.email || "",
    customerPhone: customerData.phone || "",
    companyName: customerData.companyName || "",
    vatNumber: customerData.vatNumber || "",
    items: resolvedItems,
    subtotalMinor,
    platformFeePercent: effectiveFeePercent,
    platformFeeMinor,
    businessAmountMinor,
    cashbackMinor: effectiveCashbackMinor,
    currency: business.currency || "eur",
    shippingAddress: requiresShipping ? (shippingAddress || null) : null,
    billingAddress: customerData.billingAddress || shippingAddress || null,
    requiresShipping,
    guestAccessTokenHash,
    termsAcceptedAt: customerData.termsAccepted ? new Date() : null,
    poNumber: poNumber || "",
    customerNote: customerData.note || "",
    status: "pending",
    walletPortionMinor: cappedWalletPortion,
    walletTransferStatus: cappedWalletPortion > 0 ? "pending" : "not_applicable",
    pointsRedeemed: requestedPointsToRedeem,
    pointsDiscountMinor,
    calculationSnapshot: {
      version: 1,
      subtotalMinor,
      platformFeePercent: effectiveFeePercent,
      platformFeeMinor,
      cashbackPercent,
      cashbackMinor: effectiveCashbackMinor,
      businessAmountMinor,
      walletPortionMinor: cappedWalletPortion,
      pointsRedeemed: requestedPointsToRedeem,
      pointsDiscountMinor,
      calculatedAt: new Date(),
      chargeRuleIds: [configuredRules.platformFee?._id, configuredRules.cashback?._id].filter(Boolean),
      chargeType: "destination_charge",
      cashbackFundingParty: "platform",
      connectedAccountId: business.stripeConnectedAccountId,
    },
    stripeConnectedAccountId: business.stripeConnectedAccountId,
    cashbackFundingParty: "platform",
  });

  // 100%-covered by points + wallet — Stripe can't create a €0 (or
  // negative) destination charge, so debit the wallet directly and fulfil
  // immediately via the same settlement path a real Stripe payment takes,
  // skipping the charge-reconciliation step entirely (there's no Stripe
  // charge/transfer/application-fee to reconcile). Mirrors
  // paymentController.js's payWithWalletOnly for donations/memberships.
  if (cardPortionMinor <= 0) {
    const debited = await deferWalletDebit(customerId, cappedWalletPortion, {
      type: "purchase",
      description: `V.Commerce order ${order.orderNumber} at ${business.businessName}`,
      referenceType: "businessOrder",
      referenceId: order._id.toString(),
      initiatedBy: "customer",
    });
    if (!debited.success) {
      await BusinessOrder.findByIdAndUpdate(order._id, { $set: { status: "cancelled" } }).catch(() => {});
      const e = new Error(debited.error || "Could not charge your V.Wallet balance.");
      e.status = 400;
      throw e;
    }

    try {
      await fulfillWalletOnlyOrder(order._id);
    } catch (fulfillmentError) {
      console.error("[vcommerce] Wallet-only fulfillment failed:", fulfillmentError.message);
      await creditWallet(customerId, cappedWalletPortion, {
        type: "refund",
        description: `Refund — could not complete order ${order.orderNumber}`,
        referenceType: "businessOrder",
        referenceId: order._id.toString(),
        initiatedBy: "customer",
      }).catch((refundErr) => {
        console.error("[vcommerce] CRITICAL: wallet refund after failed fulfillment also failed:", refundErr.message);
      });
      const e = new Error("We couldn't complete this order, so your V.Wallet balance (and any points used) have been refunded. Please try again.");
      e.status = 500;
      throw e;
    }

    return {
      mode: "wallet_only",
      orderId: order._id.toString(),
      cashbackMinor: effectiveCashbackMinor,
      subtotalMinor,
      walletPortionMinor: cappedWalletPortion,
      pointsDiscountMinor,
      orderAccessToken: guestAccessToken || undefined,
    };
  }

  const cardApplicationFeeMinor = Math.round((cardPortionMinor * effectiveFeePercent) / 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: cardPortionMinor,
    currency: "eur",
    metadata: {
      payment_kind: "business_order",
      businessOrderId: order._id.toString(),
      businessId: businessId.toString(),
      customerId: customerId?.toString() || "",
    },
    description: `V.Commerce order at ${business.businessName}`,
    application_fee_amount: cardApplicationFeeMinor,
    transfer_data: {
      destination: business.stripeConnectedAccountId,
    },
  });

  // Store the payment intent ID on the order
  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  return {
    mode: "stripe",
    clientSecret: paymentIntent.client_secret,
    orderId: order._id.toString(),
    cashbackMinor: effectiveCashbackMinor,
    subtotalMinor,
    walletPortionMinor: cappedWalletPortion,
    cardPortionMinor,
    pointsDiscountMinor,
    orderAccessToken: guestAccessToken || undefined,
  };
}

export async function fulfillOrder(paymentIntentOrId) {
  const paymentIntentId = typeof paymentIntentOrId === "string" ? paymentIntentOrId : paymentIntentOrId.id;
  const order = await BusinessOrder.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!order) {
    console.warn(`[vcommerce] No order found for paymentIntentId=${paymentIntentId}`);
    return null;
  }

  if (order.status !== "pending") {
    // Already fulfilled (webhook idempotency)
    return order;
  }

  order.status = "paid";
  order.paymentStatus = "succeeded";
  order.paidAt = new Date();
  const stripe = getVCommerceStripe();
  try {
    const intent = typeof paymentIntentOrId === "string"
      ? await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] })
      : paymentIntentOrId;
    const chargeId = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId, { expand: ["balance_transaction"] });
      order.stripeChargeId = charge.id;
      order.stripeTransferId = typeof charge.transfer === "string" ? charge.transfer : charge.transfer?.id || "";
      order.stripeApplicationFeeId = typeof charge.application_fee === "string"
        ? charge.application_fee : charge.application_fee?.id || "";
      const balanceTransaction = charge.balance_transaction;
      order.stripeBalanceTransactionId = typeof balanceTransaction === "string"
        ? balanceTransaction : balanceTransaction?.id || "";
      order.stripeProcessingFeeMinor = typeof balanceTransaction === "object"
        ? Number(balanceTransaction.fee || 0) : 0;
    }
  } catch (error) {
    console.warn("[vcommerce] Charge reconciliation will be retried from webhooks:", error.message);
  }
  order.payoutEligibleAt = order.stripeConnectedAccountId
    ? null
    : addBusinessDays(new Date(), VCOMMERCE_PAYOUT_DELAY_BUSINESS_DAYS);
  await order.save();

  return settleOrderFulfillment(order);
}

/**
 * 100%-covered-by-points-and-wallet order: no Stripe PaymentIntent exists at
 * all (see the cardPortionMinor <= 0 branch in createOrderIntent above), so
 * there's nothing to reconcile — just transition status and run the same
 * settlement every other order goes through.
 */
async function fulfillWalletOnlyOrder(orderId) {
  const order = await BusinessOrder.findById(orderId);
  if (!order) return null;
  if (order.status !== "pending") return order;

  order.status = "paid";
  order.paymentStatus = "succeeded";
  order.paidAt = new Date();
  order.payoutEligibleAt = null;
  await order.save();

  return settleOrderFulfillment(order);
}

/**
 * Shared post-payment settlement — stock, cashback, business counters,
 * ledger entries, the wallet-funded portion's seller payout, and receipt
 * emails. Called once payment has been confirmed (either a real Stripe
 * charge via fulfillOrder, or a wallet/points-only order via
 * fulfillWalletOnlyOrder) and the order has already transitioned to "paid".
 */
async function settleOrderFulfillment(order) {
  for (const item of order.items) {
    if (item.productType !== "service") {
      await BusinessProduct.updateOne(
        { _id: item.productId, stockCount: { $ne: null } },
        { $inc: { stockCount: -item.quantity } }
      );
    }
  }

  // Credit cashback to customer V.Wallet
  if (order.customerId && order.cashbackMinor > 0) {
    try {
      const { transaction } = await creditWallet(order.customerId, order.cashbackMinor, {
        type: "adminCredit",
        description: `Cashback from ${order.businessName} via V.Commerce`,
        referenceType: "businessOrder",
        referenceId: order._id.toString(),
        initiatedBy: "system",
        allowOverCap: true,
      });
      order.walletTransactionId = transaction._id;
      await order.save();
    } catch (e) {
      console.error("[vcommerce] Cashback credit failed:", e.message);
    }
  }

  // Update business counters
  const businessIncrements = {
    totalRevenueMinor: order.subtotalMinor,
    totalFeesMinor: order.platformFeeMinor,
    totalOrders: 1,
  };
  if (!order.stripeConnectedAccountId) {
    businessIncrements.pendingPayoutMinor = order.businessAmountMinor;
  }
  await BusinessProfile.findByIdAndUpdate(order.businessId, { $inc: businessIncrements });

  await VCommerceLedgerEntry.insertMany([
    {
      businessId: order.businessId, orderId: order._id, entryType: "sale", direction: "credit",
      amountMinor: order.subtotalMinor, currency: order.currency, description: `Sale ${order._id}`,
      idempotencyKey: `order:${order._id}:sale`,
    },
    {
      businessId: order.businessId, orderId: order._id, entryType: "fee", direction: "debit",
      amountMinor: order.platformFeeMinor, currency: order.currency, description: `Platform fee for ${order._id}`,
      idempotencyKey: `order:${order._id}:platform-fee`,
    },
    {
      businessId: order.businessId, orderId: order._id, entryType: "cashback", direction: "debit",
      amountMinor: order.cashbackMinor, currency: order.currency, description: `Customer cashback for ${order._id}`,
      idempotencyKey: `order:${order._id}:cashback`,
    },
  ], { ordered: false }).catch((error) => {
    if (error?.code !== 11000) console.error("[vcommerce] Ledger write failed:", error.message);
  });

  // Seller payout for the wallet-funded portion — a same-time Stripe
  // transfer to the connected account, separate from the (possibly
  // nonexistent, for a wallet-only order) destination-charge transfer.
  // Instant per the confirmed decision. Errors here must not roll back the
  // already-fulfilled order — log and mark for admin retry, mirroring the
  // "log and continue" pattern used for cashback-credit failures above.
  if (order.walletPortionMinor > 0) {
    try {
      const stripe = getVCommerceStripe();
      const sellerShareMinor = Math.round(order.walletPortionMinor * (1 - order.platformFeePercent / 100));
      const transfer = await stripe.transfers.create(
        {
          amount: sellerShareMinor,
          currency: order.currency,
          destination: order.stripeConnectedAccountId,
          metadata: { businessOrderId: order._id.toString(), leg: "wallet_portion" },
        },
        { idempotencyKey: `vcommerce-wallet-transfer-${order._id}` }
      );
      order.walletTransferId = transfer.id;
      order.walletTransferStatus = "succeeded";
      await order.save();

      await VCommerceLedgerEntry.create({
        businessId: order.businessId, orderId: order._id, entryType: "wallet_transfer", direction: "credit",
        amountMinor: sellerShareMinor, currency: order.currency,
        description: `Seller payout for V.Wallet-funded portion of ${order._id}`,
        idempotencyKey: `order:${order._id}:wallet-transfer`,
      }).catch((error) => {
        if (error?.code !== 11000) console.error("[vcommerce] Wallet-transfer ledger write failed:", error.message);
      });
    } catch (error) {
      console.error("[vcommerce] Wallet-portion seller transfer failed (needs admin retry):", error.message);
      order.walletTransferStatus = "failed";
      await order.save().catch(() => {});
    }
  }

  try {
    await sendBusinessOrderEmails(order);
  } catch (error) {
    console.error("[vcommerce] Confirmation/receipt delivery failed:", error.message);
  }

  return order;
}

export async function markOrderPaymentFailed(paymentIntentId, reason = "") {
  const order = await BusinessOrder.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!order || order.status !== "pending") return order;
  order.status = "failed";
  order.paymentStatus = "failed";
  order.failedAt = new Date();
  order.businessNote = reason ? `Payment failed: ${reason}`.slice(0, 500) : order.businessNote;
  await order.save();
  return order;
}

export async function getOrderStatus(orderId, customerId, accessToken = "") {
  const order = await BusinessOrder.findById(orderId).select("+guestAccessTokenHash").lean();
  const accountMatch = Boolean(customerId && order?.customerId?.toString() === customerId.toString());
  const suppliedHash = accessToken
    ? crypto.createHash("sha256").update(accessToken).digest("hex")
    : "";
  const storedToken = order?.guestAccessTokenHash || "";
  const guestMatch = Boolean(order?.checkoutMode === "guest" && storedToken && suppliedHash &&
    storedToken.length === suppliedHash.length &&
    crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(suppliedHash)));
  if (!order || (!accountMatch && !guestMatch)) {
    const err = new Error("Order not found.");
    err.status = 404;
    throw err;
  }
  delete order.guestAccessTokenHash;
  return order;
}

// Also picks up guest-checkout orders placed under the same email before the
// buyer had (or used) an account — but only guest orders (customerId: null),
// never another account's order, since customerEmail is free text (not
// normalized at checkout the way User.email is) and its uniqueness isn't
// enforced the way it is on the User model.
export async function listCustomerOrders(customerId, email, { page = 1, pageSize = 20 } = {}) {
  const trimmedEmail = String(email || "").trim();
  const filter = trimmedEmail
    ? {
        $or: [
          { customerId },
          {
            customerId: null,
            customerEmail: {
              $regex: new RegExp(`^${trimmedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
            },
          },
        ],
      }
    : { customerId };
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    BusinessOrder.countDocuments(filter),
  ]);
  return { items, total, page, pageSize };
}

export async function listBusinessOrders(businessId, { status, page = 1, pageSize = 20 } = {}) {
  const filter = { businessId };
  if (status) filter.status = status;
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    BusinessOrder.countDocuments(filter),
  ]);
  return { items, total, page, pageSize };
}

export async function markOrderFulfilled(orderId, businessId, note) {
  const order = await BusinessOrder.findOne({ _id: orderId, businessId });
  if (!order) {
    const err = new Error("Order not found.");
    err.status = 404;
    throw err;
  }
  if (order.status !== "paid") {
    const err = new Error("Only paid orders can be marked as fulfilled.");
    err.status = 400;
    throw err;
  }
  order.status = "fulfilled";
  order.fulfilledAt = new Date();
  if (note) order.businessNote = note;
  await order.save();
  return order;
}

export async function adminUpdateOrderStatus(orderId, status, note = "") {
  const order = await BusinessOrder.findById(orderId);
  if (!order) {
    const err = new Error("Order not found."); err.status = 404; throw err;
  }
  if (status === "fulfilled") {
    if (order.status !== "paid") {
      const err = new Error("Only paid orders can be fulfilled."); err.status = 400; throw err;
    }
    order.status = "fulfilled";
    order.fulfilledAt = new Date();
  } else if (status === "cancelled") {
    if (order.status !== "pending" && order.status !== "failed") {
      const err = new Error("Only unpaid orders can be cancelled."); err.status = 400; throw err;
    }
    order.status = "cancelled";
  } else {
    const err = new Error("Unsupported order status change."); err.status = 400; throw err;
  }
  if (note) order.businessNote = note;
  await order.save();
  return order;
}

export async function refundBusinessOrder(orderId, reason = "") {
  const order = await BusinessOrder.findById(orderId);
  if (!order) {
    const err = new Error("Order not found."); err.status = 404; throw err;
  }
  if (!["paid", "fulfilled"].includes(order.status)) {
    const err = new Error("Only paid orders can be refunded."); err.status = 400; throw err;
  }
  if (order.payoutId) {
    const err = new Error("This order is already included in a payout. Resolve the seller payout before refunding."); err.status = 409; throw err;
  }

  const stripe = getVCommerceStripe();
  // Wallet-only orders (100% covered by points + wallet) have no Stripe
  // PaymentIntent at all — nothing to refund on that side. Every other order
  // (full-card, or a card+wallet split) always has one for the card portion.
  if (order.stripePaymentIntentId) {
    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: "requested_by_customer",
      reverse_transfer: true,
      refund_application_fee: true,
      metadata: { businessOrderId: order._id.toString(), adminReason: reason.slice(0, 450) },
    }, { idempotencyKey: `vcommerce-refund-${order._id}` });
  }

  // A split (or wallet-only) order moved money to the seller via a second,
  // separate leg — C2's direct Stripe transfer for the wallet-funded portion,
  // outside the destination charge the refund above just reversed. Claw that
  // back too, then credit the customer's V.Wallet (and any redeemed points)
  // for what they originally paid that way — the single most complex piece
  // of this refund path, since it's a three-legged reversal in the split
  // case (destination-charge refund + transfer reversal + wallet credit).
  if (order.walletPortionMinor > 0 && order.walletTransferStatus === "succeeded" && order.walletTransferId) {
    try {
      await stripe.transfers.createReversal(
        order.walletTransferId,
        { metadata: { businessOrderId: order._id.toString() } },
        { idempotencyKey: `vcommerce-wallet-transfer-reversal-${order._id}` }
      );
      const sellerShareMinor = Math.round(order.walletPortionMinor * (1 - order.platformFeePercent / 100));
      await VCommerceLedgerEntry.create({
        businessId: order.businessId, orderId: order._id, entryType: "wallet_transfer", direction: "debit",
        amountMinor: sellerShareMinor, currency: order.currency,
        description: `Seller payout reversed for refunded ${order._id}`,
        idempotencyKey: `order:${order._id}:wallet-transfer-reversal`,
      }).catch((error) => { if (error?.code !== 11000) console.error("[vcommerce] Wallet-transfer reversal ledger write failed:", error.message); });
    } catch (error) {
      console.error("[vcommerce] Wallet-portion transfer reversal requires admin review:", error.message);
    }
  } else if (order.walletPortionMinor > 0 && order.walletTransferStatus === "failed") {
    console.warn(`[vcommerce] Order ${order._id} refunded with a wallet-portion transfer that never succeeded — nothing to reverse, but confirm no manual payout was made.`);
  }

  if (order.customerId && order.walletPortionMinor > 0) {
    try {
      await creditWallet(order.customerId, order.walletPortionMinor, {
        type: "refund",
        referenceType: "businessOrder",
        referenceId: order._id.toString(),
        initiatedBy: "system",
        description: `V.Wallet portion refunded for ${order.orderNumber}`,
        allowOverCap: true,
      });
    } catch (error) {
      console.error("[vcommerce] Wallet-portion refund requires admin review:", error.message);
    }
  }
  if (order.customerId && order.pointsRedeemed > 0) {
    try {
      const { awardPoints } = await import("./walletService.js");
      await awardPoints(order.customerId, order.pointsRedeemed, {
        description: `Points refunded for refunded order ${order.orderNumber}`,
        referenceType: "businessOrder",
        referenceId: order._id.toString(),
        initiatedBy: "system",
      });
    } catch (error) {
      console.error("[vcommerce] Points refund requires admin review:", error.message);
    }
  }

  order.status = "refunded";
  order.paymentStatus = "refunded";
  order.refundedAt = new Date();
  if (reason) order.businessNote = `Refunded: ${reason}`.slice(0, 500);
  await order.save();

  for (const item of order.items) {
    if (item.productType !== "service") {
      await BusinessProduct.updateOne(
        { _id: item.productId, stockCount: { $ne: null } },
        { $inc: { stockCount: item.quantity } }
      );
    }
  }

  const refundIncrements = {
    totalRevenueMinor: -order.subtotalMinor,
    totalFeesMinor: -order.platformFeeMinor,
    totalOrders: -1,
  };
  if (!order.stripeConnectedAccountId) {
    refundIncrements.pendingPayoutMinor = -order.businessAmountMinor;
  }
  await BusinessProfile.findByIdAndUpdate(order.businessId, { $inc: refundIncrements });
  await VCommerceLedgerEntry.create({
    businessId: order.businessId, orderId: order._id, entryType: "refund", direction: "debit",
    amountMinor: order.subtotalMinor, currency: order.currency, description: `Refund ${order.orderNumber || order._id}`,
    idempotencyKey: `order:${order._id}:refund`,
  }).catch((error) => { if (error?.code !== 11000) throw error; });

  if (order.customerId && order.cashbackMinor > 0) {
    try {
      const { debitWallet } = await import("./walletService.js");
      await debitWallet(order.customerId, order.cashbackMinor, {
        type: "purchase", referenceType: "businessOrder", referenceId: order._id.toString(),
        initiatedBy: "system", description: `Cashback reversed for refunded ${order.orderNumber}`,
      });
    } catch (error) {
      console.error("[vcommerce] Cashback reversal requires admin review:", error.message);
    }
  }
  return order;
}

export async function adminListAllOrders({ businessId, status, page = 1, pageSize = 20 } = {}) {
  const filter = {};
  if (businessId) filter.businessId = businessId;
  if (status) filter.status = status;
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    BusinessOrder.countDocuments(filter),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
