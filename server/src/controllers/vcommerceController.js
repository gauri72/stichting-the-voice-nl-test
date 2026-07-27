import {
  getFeaturedBusiness,
  listBusinesses,
  getBusinessBySlug,
  getMarketplaceStats,
  getPopularProducts,
} from "../services/businessSpotlightService.js";
import {
  getApplicationStatus,
  createApplication,
} from "../services/businessApplicationService.js";
import { getOrderStatus, createOrderIntent, listCustomerOrders } from "../services/businessOrderService.js";
import { postReview, getReviews } from "../services/businessReviewService.js";
import { checkRateLimit } from "../utils/rateLimit.js";
import {
  createApplicationPackageCheckout,
  confirmApplicationPackageCheckout,
} from "../services/vcommercePackageService.js";
import { handleError as handleErrorBase } from "../utils/handleError.js";

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function handleError(res, err) {
  return handleErrorBase(res, err, { logTag: "[vcommerce]" });
}

export async function getFeatured(req, res) {
  try {
    const { business, alternates } = await getFeaturedBusiness();
    ok(res, { business, alternates });
  } catch (e) {
    handleError(res, e);
  }
}

export async function getStats(req, res) {
  try {
    const stats = await getMarketplaceStats();
    ok(res, stats);
  } catch (e) {
    handleError(res, e);
  }
}

export async function getPopularProductsHandler(req, res) {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 24) : 12;
    const products = await getPopularProducts({ limit });
    ok(res, { products });
  } catch (e) {
    handleError(res, e);
  }
}

export async function getList(req, res) {
  try {
    const { category, search, page, pageSize } = req.query;
    const result = await listBusinesses({
      category,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 12,
    });
    ok(res, result);
  } catch (e) {
    handleError(res, e);
  }
}

export async function getProfile(req, res) {
  try {
    const business = await getBusinessBySlug(req.params.slug);
    ok(res, { business });
  } catch (e) {
    handleError(res, e);
  }
}

export async function getApplyStatus(req, res) {
  try {
    const status = await getApplicationStatus(req.user.id);
    ok(res, status);
  } catch (e) {
    handleError(res, e);
  }
}

export async function postApply(req, res) {
  try {
    const rl = checkRateLimit(`vco_apply:${req.user.id}`, { maxAttempts: 3, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "Too many applications. Please wait before trying again." });
    }
    const application = await createApplication(req.user.id, req.body);
    const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
    const checkout = await createApplicationPackageCheckout(req.user.id, application, origin);
    return ok(res, { application, ...checkout }, 201);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function confirmApplicationPayment(req, res) {
  try {
    const result = await confirmApplicationPackageCheckout(req.user.id, req.query.sessionId);
    ok(res, {
      applicationStatus: result.application.status,
      businessId: result.business._id,
      businessSlug: result.business.slug,
    });
  } catch (e) {
    handleError(res, e);
  }
}

export async function postCreateOrder(req, res) {
  try {
    const actorKey = req.user?.id || req.ip || "guest";
    const rl = checkRateLimit(`vco_order:${actorKey}`, { maxAttempts: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "Too many order requests. Please wait a moment." });
    }
    const { items, shippingAddress, billingAddress, referralCode, poNumber, walletPortionMinor, pointsToRedeem } = req.body;
    const guest = !req.user;
    const email = String(req.body.email || req.user?.email || "").trim().toLowerCase();
    const name = String(req.body.name || `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim()).trim();
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Your cart is empty." });
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid full name and email address are required." });
    }
    if (!String(req.body.phone || "").trim()) return res.status(400).json({ error: "A phone number is required." });
    if (!req.body.termsAccepted) return res.status(400).json({ error: "Please accept the terms and privacy policy." });
    const customerData = {
      name,
      email,
      phone: req.body.phone || "",
      companyName: req.body.companyName || "",
      vatNumber: req.body.vatNumber || "",
      billingAddress,
      termsAccepted: true,
      note: req.body.customerNote || "",
    };
    const result = await createOrderIntent(
      req.user?.id || null,
      customerData,
      req.params.businessId,
      items,
      shippingAddress,
      { referralCode, poNumber, walletPortionMinor, pointsToRedeem }
    );
    return ok(res, result, 201);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function postReviewHandler(req, res) {
  try {
    const { orderId, rating, body } = req.body;
    const reviewerName = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim();
    const review = await postReview(req.user.id, reviewerName, req.params.businessId, orderId, { rating, body });
    return ok(res, { review }, 201);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getReviewsHandler(req, res) {
  try {
    const business = await getBusinessBySlug(req.params.slug);
    const { page, pageSize } = req.query;
    const result = await getReviews(business._id, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 20) : 10,
    });
    return ok(res, result);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getOrderStatusHandler(req, res) {
  try {
    const order = await getOrderStatus(req.params.orderId, req.user?.id || null, req.query.accessToken || "");
    ok(res, { order });
  } catch (e) {
    handleError(res, e);
  }
}

export async function getMyOrdersHandler(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const result = await listCustomerOrders(req.user.id, req.user.email, { page, pageSize });
    ok(res, result);
  } catch (e) {
    handleError(res, e);
  }
}
