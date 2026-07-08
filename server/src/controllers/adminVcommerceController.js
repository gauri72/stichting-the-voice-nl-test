import {
  listApplications,
  reviewApplication,
} from "../services/businessApplicationService.js";
import {
  getAdminBusinessList,
  updateBusinessProfile,
  setFeaturedBusiness,
} from "../services/businessSpotlightService.js";
import { adminListProducts, adminUpdateProduct } from "../services/businessProductService.js";
import { adminListAllOrders } from "../services/businessOrderService.js";
import {
  listPayouts,
  createPayout,
  markPayoutPaid,
  getAdminPayoutAnalytics,
  getBusinessPendingPayoutSummary,
} from "../services/businessPayoutService.js";
import BusinessProfile from "../models/BusinessProfile.js";
import BusinessOrder from "../models/BusinessOrder.js";

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function fail(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || "Unexpected error" });
}

// --- Applications ---

export async function getApplications(req, res) {
  try {
    const { status, search, page, pageSize } = req.query;
    const result = await listApplications({
      status,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    ok(res, result);
  } catch (e) {
    fail(res, e);
  }
}

export async function patchApplication(req, res) {
  try {
    const { action, note } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action must be approve or reject" });
    }
    const application = await reviewApplication(req.params.id, req.admin._id, { action, note });
    ok(res, { application });
  } catch (e) {
    fail(res, e);
  }
}

// --- Businesses ---

export async function getBusinesses(req, res) {
  try {
    const { status, category, search, page, pageSize } = req.query;
    const result = await getAdminBusinessList({
      status,
      category,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    ok(res, result);
  } catch (e) {
    fail(res, e);
  }
}

export async function getOneBusiness(req, res) {
  try {
    const business = await BusinessProfile.findById(req.params.id)
      .populate("userId", "firstName lastName email")
      .lean();
    if (!business) return res.status(404).json({ error: "Business not found" });
    const products = await adminListProducts(business._id);
    ok(res, { business, products });
  } catch (e) {
    fail(res, e);
  }
}

export async function patchBusiness(req, res) {
  try {
    const business = await updateBusinessProfile(req.params.id, req.body);
    ok(res, { business });
  } catch (e) {
    fail(res, e);
  }
}

export async function postSetFeatured(req, res) {
  try {
    const business = await setFeaturedBusiness(req.params.id);
    ok(res, { business });
  } catch (e) {
    fail(res, e);
  }
}

export async function patchAdminProduct(req, res) {
  try {
    const product = await adminUpdateProduct(req.params.productId, req.body);
    ok(res, { product });
  } catch (e) {
    fail(res, e);
  }
}

// --- Orders ---

export async function getOrders(req, res) {
  try {
    const { businessId, status, page, pageSize } = req.query;
    const result = await adminListAllOrders({
      businessId,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    ok(res, result);
  } catch (e) {
    fail(res, e);
  }
}

export async function getOneOrder(req, res) {
  try {
    const order = await BusinessOrder.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    ok(res, { order });
  } catch (e) {
    fail(res, e);
  }
}

// --- Payouts ---

export async function getPayouts(req, res) {
  try {
    const { businessId, status, page, pageSize } = req.query;
    const result = await listPayouts({
      businessId,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    ok(res, result);
  } catch (e) {
    fail(res, e);
  }
}

export async function getPayoutSummary(req, res) {
  try {
    const summary = await getBusinessPendingPayoutSummary(req.params.businessId);
    ok(res, { summary });
  } catch (e) {
    fail(res, e);
  }
}

export async function postCreatePayout(req, res) {
  try {
    const { businessId, orderIds } = req.body;
    const payout = await createPayout(req.admin._id, businessId, orderIds);
    ok(res, { payout }, 201);
  } catch (e) {
    fail(res, e);
  }
}

export async function patchMarkPayoutPaid(req, res) {
  try {
    const { paymentReference, notes } = req.body;
    const payout = await markPayoutPaid(req.params.id, { paymentReference, notes });
    ok(res, { payout });
  } catch (e) {
    fail(res, e);
  }
}

// --- Analytics ---

export async function getAnalytics(req, res) {
  try {
    const data = await getAdminPayoutAnalytics();
    ok(res, data);
  } catch (e) {
    fail(res, e);
  }
}
