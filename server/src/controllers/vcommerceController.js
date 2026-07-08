import {
  getFeaturedBusiness,
  listBusinesses,
  getBusinessBySlug,
} from "../services/businessSpotlightService.js";
import {
  getApplicationStatus,
  createApplication,
} from "../services/businessApplicationService.js";
import { getOrderStatus, createOrderIntent } from "../services/businessOrderService.js";
import { checkRateLimit } from "../utils/rateLimit.js";

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function fail(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || "Unexpected error" });
}

export async function getFeatured(req, res) {
  try {
    const business = await getFeaturedBusiness();
    ok(res, { business });
  } catch (e) {
    fail(res, e);
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
    fail(res, e);
  }
}

export async function getProfile(req, res) {
  try {
    const business = await getBusinessBySlug(req.params.slug);
    ok(res, { business });
  } catch (e) {
    fail(res, e);
  }
}

export async function getApplyStatus(req, res) {
  try {
    const status = await getApplicationStatus(req.user.id);
    ok(res, status);
  } catch (e) {
    fail(res, e);
  }
}

export async function postApply(req, res) {
  try {
    const rl = checkRateLimit(`vco_apply:${req.user.id}`, { maxAttempts: 3, windowMs: 60 * 60_000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "Too many applications. Please wait before trying again." });
    }
    const application = await createApplication(req.user.id, req.body);
    return ok(res, { application }, 201);
  } catch (e) {
    return fail(res, e);
  }
}

export async function postCreateOrder(req, res) {
  try {
    const rl = checkRateLimit(`vco_order:${req.user.id}`, { maxAttempts: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "Too many order requests. Please wait a moment." });
    }
    const { items, shippingAddress } = req.body;
    const customerData = {
      name: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim(),
      email: req.user.email || "",
    };
    const result = await createOrderIntent(
      req.user.id,
      customerData,
      req.params.businessId,
      items,
      shippingAddress
    );
    return ok(res, result, 201);
  } catch (e) {
    return fail(res, e);
  }
}

export async function getOrderStatusHandler(req, res) {
  try {
    const order = await getOrderStatus(req.params.orderId, req.user.id);
    ok(res, { order });
  } catch (e) {
    fail(res, e);
  }
}
