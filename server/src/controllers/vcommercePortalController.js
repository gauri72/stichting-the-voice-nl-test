import BusinessProfile from "../models/BusinessProfile.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  adminListProducts,
  setBulkPricing,
} from "../services/businessProductService.js";
import { listBusinessOrders, markOrderFulfilled } from "../services/businessOrderService.js";
import { listPayouts } from "../services/businessPayoutService.js";
import { updateBusinessProfile } from "../services/businessSpotlightService.js";
import {
  uploadAsset,
  isMediaStorageConfigured,
} from "../services/mediaStorageService.js";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "../config/cmsConfig.js";
import {
  importProductsFromExcel,
  generateExcelTemplate,
  getImportHistory,
} from "../services/businessExcelImportService.js";
import {
  createSellerOnboardingLink,
  refreshSellerConnectStatus,
} from "../services/businessConnectService.js";
import { createPackageCheckout } from "../services/vcommercePackageService.js";
import { submitBusinessForReview } from "../services/businessApplicationService.js";
import BusinessApplication from "../models/BusinessApplication.js";

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function ok(res, data, status = 200) {
  return res.status(status).json(data);
}

function fail(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || "Unexpected error" });
}

async function getOwnBusiness(userId) {
  const business = await BusinessProfile.findOne({ userId }).lean();
  if (!business) {
    const err = new Error("No approved business found for your account.");
    err.status = 404;
    throw err;
  }
  return business;
}

export async function getMyBusiness(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const application = business.applicationId
      ? await BusinessApplication.findById(business.applicationId).select("status reviewNote paidAt").lean()
      : null;
    ok(res, {
      business: {
        ...business,
        applicationStatus: application?.status || null,
        applicationReviewNote: application?.reviewNote || "",
        packagePaidAt: application?.paidAt || null,
      },
    });
  } catch (e) {
    fail(res, e);
  }
}

export async function postSubmitForReview(req, res) {
  try {
    const result = await submitBusinessForReview(req.user.id);
    ok(res, { status: result.application.status });
  } catch (e) {
    if (e.missing) return res.status(e.status || 400).json({ error: e.message, missing: e.missing });
    fail(res, e);
  }
}

export async function patchMyBusiness(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    // Restrict what a business owner can self-edit (no fee/cashback changes from portal)
    const allowed = [
      "tagline", "description", "contactEmail", "contactPhone", "website",
      "socialLinks", "location", "logoUrl", "bannerUrl", "galleryUrls",
      "payoutBankName", "payoutIBAN", "payoutBankHolder",
      "sellingMode",
    ];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const updated = await updateBusinessProfile(business._id, data);
    ok(res, { business: updated });
  } catch (e) {
    fail(res, e);
  }
}

export async function getMyProducts(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const products = await adminListProducts(business._id);
    ok(res, { products });
  } catch (e) {
    fail(res, e);
  }
}

export async function postMyProduct(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const product = await createProduct(req.user.id, business._id, req.body);
    ok(res, { product }, 201);
  } catch (e) {
    fail(res, e);
  }
}

export async function patchMyProduct(req, res) {
  try {
    const product = await updateProduct(req.user.id, req.params.productId, req.body);
    ok(res, { product });
  } catch (e) {
    fail(res, e);
  }
}

export async function deleteMyProduct(req, res) {
  try {
    await deleteProduct(req.user.id, req.params.productId);
    ok(res, { success: true });
  } catch (e) {
    fail(res, e);
  }
}

export async function postReorderProducts(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    await reorderProducts(req.user.id, business._id, req.body.orderedIds);
    ok(res, { success: true });
  } catch (e) {
    fail(res, e);
  }
}

export async function getMyOrders(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const { status, page, pageSize } = req.query;
    const result = await listBusinessOrders(business._id, {
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    ok(res, { ...result, orders: result.items });
  } catch (e) {
    fail(res, e);
  }
}

export async function patchMyOrderFulfilled(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const order = await markOrderFulfilled(req.params.orderId, business._id, req.body.note);
    ok(res, { order });
  } catch (e) {
    fail(res, e);
  }
}

export async function getMyPayouts(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const { status, page, pageSize } = req.query;
    const result = await listPayouts({
      businessId: business._id,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Math.min(Number(pageSize), 50) : 20,
    });
    ok(res, { ...result, payouts: result.items });
  } catch (e) {
    fail(res, e);
  }
}

export async function patchMyProductPricing(req, res) {
  try {
    const { tiers, minOrderQty, maxOrderQty } = req.body;
    const product = await setBulkPricing(req.user.id, req.params.productId, { tiers, minOrderQty, maxOrderQty });
    ok(res, { product });
  } catch (e) {
    fail(res, e);
  }
}

export async function postImportProducts(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    const result = await importProductsFromExcel(
      req.user.id,
      business._id,
      req.file.buffer,
      req.file.originalname
    );
    return ok(res, result);
  } catch (e) {
    return fail(res, e);
  }
}

export async function getProductsTemplate(req, res) {
  try {
    const buffer = generateExcelTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="vcommerce-products-template.xlsx"');
    return res.send(buffer);
  } catch (e) {
    return fail(res, e);
  }
}

export async function getMyImportHistory(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const history = await getImportHistory(req.user.id, business._id);
    ok(res, { history });
  } catch (e) {
    fail(res, e);
  }
}

export async function getMyReferralLink(req, res) {
  try {
    const business = await getOwnBusiness(req.user.id);
    const host = req.get("origin") || `${req.protocol}://${req.get("host")}`;
    const code = business.directReferralCode || "";
    const url = code ? `${host}/vcommerce?ref=${code}` : null;
    ok(res, { code, url });
  } catch (e) {
    fail(res, e);
  }
}

export async function postConnectOnboarding(req, res) {
  try {
    const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
    const returnUrl = `${origin}/dashboard/vcommerce?connect=complete`;
    const refreshUrl = `${origin}/dashboard/vcommerce?connect=refresh`;
    ok(res, await createSellerOnboardingLink(req.user.id, { returnUrl, refreshUrl }));
  } catch (e) {
    fail(res, e);
  }
}

export async function getConnectStatus(req, res) {
  try {
    ok(res, await refreshSellerConnectStatus(req.user.id));
  } catch (e) {
    fail(res, e);
  }
}

export async function postPackageCheckout(req, res) {
  try {
    const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
    ok(res, await createPackageCheckout(req.user.id, origin));
  } catch (e) {
    fail(res, e);
  }
}

export async function uploadBusinessImage(req, res) {
  try {
    const { field } = req.params;
    if (!["logo", "banner"].includes(field)) {
      return res.status(400).json({ error: "Invalid field. Must be logo or banner." });
    }
    if (!isMediaStorageConfigured()) {
      return res.status(503).json({ error: "Image storage is not configured." });
    }
    const { imageData } = req.body || {};
    if (!imageData) return res.status(400).json({ error: "imageData is required." });

    const parsed = parseDataUrl(imageData);
    if (!parsed) return res.status(400).json({ error: "Invalid image format. Expected base64 data URL." });
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(parsed.mimeType)) {
      return res.status(400).json({ error: `Unsupported image type: ${parsed.mimeType}.` });
    }
    const buffer = Buffer.from(parsed.base64, "base64");
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return res.status(400).json({ error: "Image exceeds 6MB size limit." });
    }

    const business = await getOwnBusiness(req.user.id);
    const asset = await uploadAsset(buffer, {
      category: "business_profiles",
      visibility: "public",
      mimeType: parsed.mimeType,
      alt: `${business.businessName} ${field}`,
      uploadedBy: req.user.id,
    });

    const urlField = field === "logo" ? "logoUrl" : "bannerUrl";
    const url = asset.webpUrl || asset.originalUrl;
    await updateBusinessProfile(business._id, { [urlField]: url });
    return ok(res, { url });
  } catch (e) {
    return fail(res, e);
  }
}
