import MediaAsset from "../models/MediaAsset.js";
import {
  uploadAsset,
  deleteAsset,
  listUsage,
  isMediaStorageConfigured,
} from "../services/mediaStorageService.js";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "../config/cmsConfig.js";
import { escapeRegex } from "../utils/regexUtils.js";

import { handleError as handleErrorBase } from "../utils/handleError.js";

function handleError(res, error) {
  return handleErrorBase(res, error, { logTag: "[media-library]", extra: { usage: error.usage } });
}

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

export async function listMediaAssetsAdmin(req, res) {
  try {
    const { category, tag, status = "active", search } = req.query;
    const query = { status };
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) query.alt = { $regex: escapeRegex(search), $options: "i" };
    const assets = await MediaAsset.find(query).sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ assets, configured: isMediaStorageConfigured() });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function uploadMediaAssetAdmin(req, res) {
  try {
    if (!isMediaStorageConfigured()) {
      const err = new Error("AWS is not configured yet — set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.");
      err.status = 503;
      throw err;
    }
    const { imageData, category = "cms", alt = "", tags = [] } = req.body || {};
    const parsed = parseDataUrl(imageData);
    if (!parsed) {
      const err = new Error("Invalid image data format. Expected base64 data URL.");
      err.status = 400;
      throw err;
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(parsed.mimeType)) {
      const err = new Error(`Unsupported image type: ${parsed.mimeType}.`);
      err.status = 400;
      throw err;
    }
    const buffer = Buffer.from(parsed.base64, "base64");
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      const err = new Error(`Image exceeds maximum size of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
      err.status = 400;
      throw err;
    }
    const asset = await uploadAsset(buffer, {
      category,
      visibility: "public",
      alt,
      mimeType: parsed.mimeType,
      uploadedBy: req.admin?.id || null,
    });
    if (Array.isArray(tags) && tags.length) {
      await MediaAsset.updateOne({ assetId: asset.assetId }, { $set: { tags } });
    }
    return res.status(201).json({ asset: { ...asset, tags } });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getMediaAssetUsageAdmin(req, res) {
  try {
    const usage = await listUsage(req.params.assetId);
    return res.json({ usage });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function archiveMediaAssetAdmin(req, res) {
  try {
    const asset = await MediaAsset.findOneAndUpdate(
      { assetId: req.params.assetId },
      { $set: { status: "archived" } },
      { new: true }
    ).lean();
    if (!asset) {
      const err = new Error("Asset not found.");
      err.status = 404;
      throw err;
    }
    return res.json({ asset });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteMediaAssetAdmin(req, res) {
  try {
    await deleteAsset(req.params.assetId);
    return res.json({ deleted: true });
  } catch (error) {
    return handleError(res, error);
  }
}
