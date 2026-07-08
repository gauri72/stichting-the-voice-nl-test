import BusinessProfile from "../models/BusinessProfile.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  adminListProducts,
} from "../services/businessProductService.js";
import { listBusinessOrders, markOrderFulfilled } from "../services/businessOrderService.js";
import { listPayouts } from "../services/businessPayoutService.js";
import { updateBusinessProfile } from "../services/businessSpotlightService.js";
import {
  uploadAsset,
  isMediaStorageConfigured,
} from "../services/mediaStorageService.js";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "../config/cmsConfig.js";

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
    ok(res, { business });
  } catch (e) {
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
    ok(res, result);
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
    ok(res, result);
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
