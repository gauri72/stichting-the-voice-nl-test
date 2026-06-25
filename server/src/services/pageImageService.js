import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  CMS_AUDIT_ACTIONS,
} from "../config/cmsConfig.js";
import { throwError } from "./cmsValidationService.js";
import { logAdminAction } from "./adminAuditService.js";
import { uploadAsset, isMediaStorageConfigured } from "./mediaStorageService.js";

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function estimateBase64Size(base64) {
  return Math.ceil((base64.length * 3) / 4);
}

export async function processPageImageUpload({ imageData, imageType, alt, focusPosition }, adminId) {
  if (!imageData) throwError("Image data is required.");

  const parsed = parseDataUrl(imageData);
  if (!parsed) throwError("Invalid image data format. Expected base64 data URL.");

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(parsed.mimeType)) {
    throwError(`Unsupported image type: ${parsed.mimeType}. Allowed: JPG, PNG, WEBP, SVG.`);
  }

  const size = estimateBase64Size(parsed.base64);
  if (size > MAX_IMAGE_SIZE_BYTES) {
    throwError(`Image exceeds maximum size of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
  }

  let result;
  if (isMediaStorageConfigured()) {
    const buffer = Buffer.from(parsed.base64, "base64");
    const asset = await uploadAsset(buffer, {
      category: "cms",
      visibility: "public",
      alt: alt || "",
      mimeType: parsed.mimeType,
      uploadedBy: adminId || null,
    });
    result = {
      url: asset.originalUrl,
      originalUrl: asset.originalUrl,
      optimizedUrl: asset.webpUrl || asset.originalUrl,
      mobileUrl: asset.mobileUrl || "",
      thumbnailUrl: asset.thumbnailUrl || "",
      assetId: asset.assetId,
      alt: alt || "",
      focusPosition: focusPosition || "center",
      imageType: imageType || "section",
      mimeType: parsed.mimeType,
      sizeBytes: size,
    };
  } else {
    // AWS not configured yet — fall back to the original behavior (base64
    // stored directly) so uploads keep working in environments without S3.
    result = {
      url: imageData,
      originalUrl: imageData,
      optimizedUrl: imageData,
      alt: alt || "",
      focusPosition: focusPosition || "center",
      imageType: imageType || "section",
      mimeType: parsed.mimeType,
      sizeBytes: size,
    };
  }

  await logAdminAction({
    adminId,
    action: CMS_AUDIT_ACTIONS.IMAGE_UPLOADED,
    targetType: "cms_image",
    targetId: imageType || "section",
    summary: `Uploaded ${imageType || "section"} image (${parsed.mimeType})`,
    detail: { imageType, mimeType: parsed.mimeType, sizeBytes: size },
  });

  return result;
}

export const IMAGE_SIZE_GUIDANCE = {
  hero: "1920×1080px recommended (16:9)",
  mobile_hero: "750×1334px recommended",
  breadcrumb: "1920×600px recommended",
  card: "600×400px recommended",
  section: "1200×800px recommended",
  background: "1920×1080px recommended",
  logo: "400×120px recommended (SVG preferred)",
  icon: "64×64px recommended (SVG preferred)",
  gallery: "800×600px recommended",
  og: "1200×630px recommended",
};
