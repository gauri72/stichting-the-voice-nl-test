import BusinessProfile from "../models/BusinessProfile.js";
import BusinessProduct from "../models/BusinessProduct.js";
import BusinessOrder from "../models/BusinessOrder.js";
import { creditWallet } from "./walletService.js";
import { getStripe } from "./stripe.js";
import {
  VCOMMERCE_PLATFORM_FEE_PERCENT,
  VCOMMERCE_PAYOUT_DELAY_BUSINESS_DAYS,
} from "../config/vcommercePlans.js";
import VCommerceLedgerEntry from "../models/VCommerceLedgerEntry.js";
import { resolveOrderChargeRules } from "./vcommerceAdminOperationsService.js";

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

  // Create the Stripe PaymentIntent
  const stripe = getStripe();

  // Create the BusinessOrder first to get its ID for metadata
  const order = await BusinessOrder.create({
    businessId,
    customerId,
    businessName: business.businessName,
    customerName: customerData.name || "",
    customerEmail: customerData.email || "",
    items: resolvedItems,
    subtotalMinor,
    platformFeePercent: effectiveFeePercent,
    platformFeeMinor,
    businessAmountMinor,
    cashbackMinor,
    currency: business.currency || "eur",
    shippingAddress: shippingAddress || null,
    poNumber: poNumber || "",
    customerNote: customerData.note || "",
    status: "pending",
    calculationSnapshot: {
      version: 1,
      subtotalMinor,
      platformFeePercent: effectiveFeePercent,
      platformFeeMinor,
      cashbackPercent,
      cashbackMinor,
      businessAmountMinor,
      calculatedAt: new Date(),
      chargeRuleIds: [configuredRules.platformFee?._id, configuredRules.cashback?._id].filter(Boolean),
    },
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: subtotalMinor,
    currency: "eur",
    metadata: {
      payment_kind: "business_order",
      businessOrderId: order._id.toString(),
      businessId: businessId.toString(),
      customerId: customerId.toString(),
    },
    description: `V.Commerce order at ${business.businessName}`,
  });

  // Store the payment intent ID on the order
  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: order._id.toString(),
    cashbackMinor,
    subtotalMinor,
  };
}

export async function fulfillOrder(paymentIntentId) {
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
  order.payoutEligibleAt = addBusinessDays(new Date(), VCOMMERCE_PAYOUT_DELAY_BUSINESS_DAYS);
  await order.save();

  // Credit cashback to customer V.Wallet
  if (order.cashbackMinor > 0) {
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
  await BusinessProfile.findByIdAndUpdate(order.businessId, {
    $inc: {
      totalRevenueMinor: order.subtotalMinor,
      totalFeesMinor: order.platformFeeMinor,
      pendingPayoutMinor: order.businessAmountMinor,
      totalOrders: 1,
    },
  });

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

  return order;
}

export async function getOrderStatus(orderId, customerId) {
  const order = await BusinessOrder.findOne({ _id: orderId, customerId }).lean();
  if (!order) {
    const err = new Error("Order not found.");
    err.status = 404;
    throw err;
  }
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
