import BusinessProfile from "../models/BusinessProfile.js";
import BusinessProduct from "../models/BusinessProduct.js";
import BusinessOrder from "../models/BusinessOrder.js";
import { creditWallet } from "./walletService.js";
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

export async function createOrderIntent(customerId, customerData, businessId, items, shippingAddress, { referralCode, poNumber } = {}) {
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
  const cashbackMinor = Math.round((subtotalMinor * cashbackPercent) / 100);
  const isGuest = !customerId;
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
    calculationSnapshot: {
      version: 1,
      subtotalMinor,
      platformFeePercent: effectiveFeePercent,
      platformFeeMinor,
      cashbackPercent,
      cashbackMinor: effectiveCashbackMinor,
      businessAmountMinor,
      calculatedAt: new Date(),
      chargeRuleIds: [configuredRules.platformFee?._id, configuredRules.cashback?._id].filter(Boolean),
      chargeType: "destination_charge",
      cashbackFundingParty: "platform",
      connectedAccountId: business.stripeConnectedAccountId,
    },
    stripeConnectedAccountId: business.stripeConnectedAccountId,
    cashbackFundingParty: "platform",
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: subtotalMinor,
    currency: "eur",
    metadata: {
      payment_kind: "business_order",
      businessOrderId: order._id.toString(),
      businessId: businessId.toString(),
      customerId: customerId?.toString() || "",
    },
    description: `V.Commerce order at ${business.businessName}`,
    application_fee_amount: platformFeeMinor,
    transfer_data: {
      destination: business.stripeConnectedAccountId,
    },
  });

  // Store the payment intent ID on the order
  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: order._id.toString(),
    cashbackMinor: effectiveCashbackMinor,
    subtotalMinor,
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

export async function listCustomerOrders(customerId, { page = 1, pageSize = 20 } = {}) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    BusinessOrder.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    BusinessOrder.countDocuments({ customerId }),
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
  await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    reason: "requested_by_customer",
    reverse_transfer: true,
    refund_application_fee: true,
    metadata: { businessOrderId: order._id.toString(), adminReason: reason.slice(0, 450) },
  }, { idempotencyKey: `vcommerce-refund-${order._id}` });

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
