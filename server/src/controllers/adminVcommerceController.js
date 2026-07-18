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
import {
  createAdminProduct,
  deleteAdminProduct,
  listChargeRules,
  saveChargeRule,
  createAdjustment,
  listAdjustments,
  listLedger,
  setOrderPayoutHold,
  createRiskFlag,
  listRiskFlags,
  updateRiskFlag,
  getOperationsOverview,
  runAutomatedRiskScan,
} from "../services/vcommerceAdminOperationsService.js";
import { getAuditLogsForTarget, logAdminAction } from "../services/adminAuditService.js";

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function fail(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || "Unexpected error" });
}

function adminId(req) {
  return req.admin?._id || req.admin?.id || null;
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
    const application = await reviewApplication(req.params.id, adminId(req), { action, note });
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
    ok(res, { ...result, businesses: result.items });
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
    const business = await updateBusinessProfile(req.params.id, req.body, { allowLifecycleOverride: true });
    await logAdminAction({
      adminId: adminId(req),
      action: "vcommerce.business.update",
      targetType: "vcommerce_business",
      targetId: business._id,
      summary: `Updated ${business.businessName}`,
      detail: { fields: Object.keys(req.body || {}) },
    });
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

export async function postAdminProduct(req, res) {
  try {
    ok(res, { product: await createAdminProduct(adminId(req), req.params.id, req.body) }, 201);
  } catch (e) { fail(res, e); }
}

export async function deleteAdminProductController(req, res) {
  try {
    ok(res, await deleteAdminProduct(adminId(req), req.params.id, req.params.productId));
  } catch (e) { fail(res, e); }
}

export async function getBusinessActivity(req, res) {
  try {
    ok(res, { activity: await getAuditLogsForTarget(req.params.id, 100) });
  } catch (e) { fail(res, e); }
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
    ok(res, { ...result, orders: result.items });
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
    ok(res, { ...result, payouts: result.items });
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
    const payout = await createPayout(adminId(req), businessId, orderIds);
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

export async function getChargeRules(req, res) {
  try { ok(res, { rules: await listChargeRules(req.query) }); } catch (e) { fail(res, e); }
}
export async function postChargeRule(req, res) {
  try { ok(res, { rule: await saveChargeRule(adminId(req), req.body) }, 201); } catch (e) { fail(res, e); }
}
export async function patchChargeRule(req, res) {
  try { ok(res, { rule: await saveChargeRule(adminId(req), req.body, req.params.id) }); } catch (e) { fail(res, e); }
}
export async function getAdjustments(req, res) {
  try { ok(res, { adjustments: await listAdjustments(req.query) }); } catch (e) { fail(res, e); }
}
export async function postAdjustment(req, res) {
  try { ok(res, { adjustment: await createAdjustment(adminId(req), req.body) }, 201); } catch (e) { fail(res, e); }
}
export async function getLedger(req, res) {
  try { ok(res, { entries: await listLedger(req.query) }); } catch (e) { fail(res, e); }
}
export async function patchOrderPayoutHold(req, res) {
  try { ok(res, { order: await setOrderPayoutHold(adminId(req), req.params.id, req.body.reason || "") }); } catch (e) { fail(res, e); }
}
export async function getRiskFlags(req, res) {
  try { ok(res, { flags: await listRiskFlags(req.query) }); } catch (e) { fail(res, e); }
}
export async function postRiskFlag(req, res) {
  try { ok(res, { flag: await createRiskFlag(adminId(req), req.body) }, 201); } catch (e) { fail(res, e); }
}
export async function patchRiskFlag(req, res) {
  try { ok(res, { flag: await updateRiskFlag(adminId(req), req.params.id, req.body) }); } catch (e) { fail(res, e); }
}
export async function getOperations(req, res) {
  try { ok(res, await getOperationsOverview()); } catch (e) { fail(res, e); }
}
export async function postRiskScan(req, res) {
  try { ok(res, await runAutomatedRiskScan(adminId(req))); } catch (e) { fail(res, e); }
}
