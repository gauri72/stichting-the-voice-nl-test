import BusinessProfile from "../models/BusinessProfile.js";
import BusinessProduct from "../models/BusinessProduct.js";
import BusinessOrder from "../models/BusinessOrder.js";
import { creditWallet } from "./walletService.js";
import { getStripe } from "./stripe.js";

export async function createOrderIntent(customerId, customerData, businessId, items, shippingAddress) {
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

    const lineTotal = product.priceMinor * item.quantity;
    subtotalMinor += lineTotal;

    resolvedItems.push({
      productId: product._id,
      productName: product.name,
      productType: product.type,
      variant: item.variant || "",
      quantity: item.quantity,
      unitPriceMinor: product.priceMinor,
      lineTotalMinor: lineTotal,
    });
  }

  if (subtotalMinor <= 0) {
    const err = new Error("Order total must be greater than zero.");
    err.status = 400;
    throw err;
  }

  const platformFeePercent = business.platformFeePercent || 0;
  const cashbackPercent = business.cashbackPercent ?? 5;

  const platformFeeMinor = Math.round((subtotalMinor * platformFeePercent) / 100);
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
    platformFeePercent,
    platformFeeMinor,
    businessAmountMinor,
    cashbackMinor,
    currency: business.currency || "eur",
    shippingAddress: shippingAddress || null,
    status: "pending",
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
    description: `VCommerce order at ${business.businessName}`,
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
  await order.save();

  // Credit cashback to customer V.Wallet
  if (order.cashbackMinor > 0) {
    try {
      const { transaction } = await creditWallet(order.customerId, order.cashbackMinor, {
        type: "adminCredit",
        description: `Cashback from ${order.businessName} via VCommerce`,
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
