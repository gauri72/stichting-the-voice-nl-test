import sharp from "sharp";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import env from "../config/env.js";
import { getNextSequence } from "../utils/sequence.js";
import MediaAsset, {
  MEDIA_PRIVATE_CATEGORIES,
  MEDIA_PUBLIC_CATEGORIES,
} from "../models/MediaAsset.js";
import MediaAssetUsage from "../models/MediaAssetUsage.js";

let cachedClient = null;
function getS3Client() {
  if (!env.aws.accessKeyId || !env.aws.secretAccessKey) {
    const err = new Error("AWS is not configured (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY missing).");
    err.status = 503;
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: env.aws.region,
      credentials: { accessKeyId: env.aws.accessKeyId, secretAccessKey: env.aws.secretAccessKey },
    });
  }
  return cachedClient;
}

export function isMediaStorageConfigured() {
  return Boolean(env.aws.accessKeyId && env.aws.secretAccessKey);
}

async function nextAssetId() {
  const seq = await getNextSequence("media_asset");
  return `MEDIA-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

/** Public CloudFront URL once the distribution exists; otherwise a direct S3
 * URL that is NOT publicly reachable (the bucket blocks public access) — kept
 * so the data shape is always complete, but real delivery needs CloudFront. */
export function buildPublicUrl(key) {
  if (env.aws.cloudFrontDomain) return `https://${env.aws.cloudFrontDomain}/${key}`;
  return `https://${env.aws.s3Bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
}

async function putObject(key, buffer, contentType) {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

function validateUploadCategory(category, visibility) {
  const allowedCategories =
    visibility === "public" ? MEDIA_PUBLIC_CATEGORIES : MEDIA_PRIVATE_CATEGORIES;
  if (!["public", "private"].includes(visibility) || !allowedCategories.includes(category)) {
    const err = new Error(
      `Invalid ${visibility} media category: ${category}.`
    );
    err.status = 400;
    throw err;
  }
}

async function deleteUploadedObjects(keys) {
  if (!keys.length) return;
  const client = getS3Client();
  await Promise.all(
    keys.map((key) =>
      client
        .send(new DeleteObjectCommand({ Bucket: env.aws.s3Bucket, Key: key }))
        .catch(() => {})
    )
  );
}

export function extensionFor(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/**
 * Uploads an image (and generated variants) to S3 and records a MediaAsset.
 * SVGs are stored as-is (no raster variants — sharp can't usefully resize a
 * vector, and re-rastering would defeat the point of using SVG).
 */
export async function uploadAsset(buffer, { category, visibility = "public", alt = "", mimeType, uploadedBy = null }) {
  validateUploadCategory(category, visibility);

  const assetId = await nextAssetId();
  const prefix = `${visibility}/${category}/${assetId}`;
  const ext = extensionFor(mimeType);
  const isVector = mimeType === "image/svg+xml";
  const uploadedKeys = [];

  const originalKey = `${prefix}/original.${ext}`;
  try {
    await putObject(originalKey, buffer, mimeType);
    uploadedKeys.push(originalKey);

    let webpKey = "";
    let mobileKey = "";
    let thumbnailKey = "";
    let width = 0;
    let height = 0;

    if (!isVector) {
      const image = sharp(buffer);
      const metadata = await image.metadata().catch(() => ({}));
      width = metadata.width || 0;
      height = metadata.height || 0;

      const [webpBuffer, mobileBuffer, thumbBuffer] = await Promise.all([
        sharp(buffer).webp({ quality: 82 }).toBuffer(),
        sharp(buffer).resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer(),
        sharp(buffer).resize({ width: 300, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer(),
      ]);

      webpKey = `${prefix}/webp.webp`;
      mobileKey = `${prefix}/mobile.jpg`;
      thumbnailKey = `${prefix}/thumbnail.jpg`;
      const variants = [
        [webpKey, webpBuffer, "image/webp"],
        [mobileKey, mobileBuffer, "image/jpeg"],
        [thumbnailKey, thumbBuffer, "image/jpeg"],
      ];
      const variantUploads = await Promise.allSettled(
        variants.map(async ([key, variantBuffer, contentType]) => {
          await putObject(key, variantBuffer, contentType);
          uploadedKeys.push(key);
        })
      );
      const failedUpload = variantUploads.find((result) => result.status === "rejected");
      if (failedUpload) throw failedUpload.reason;
    }

    const urlFor = visibility === "public" ? buildPublicUrl : () => "";

    const asset = await MediaAsset.create({
      assetId,
      category,
      visibility,
      originalKey,
      webpKey,
      mobileKey,
      thumbnailKey,
      originalUrl: urlFor(originalKey),
      webpUrl: webpKey ? urlFor(webpKey) : "",
      mobileUrl: mobileKey ? urlFor(mobileKey) : "",
      thumbnailUrl: thumbnailKey ? urlFor(thumbnailKey) : "",
      mimeType,
      sizeBytes: buffer.length,
      width,
      height,
      alt,
      uploadedBy,
    });

    return asset.toObject();
  } catch (error) {
    await deleteUploadedObjects(uploadedKeys);
    throw error;
  }
}

export async function recordUsage(assetId, { usedInType, usedInId, label = "" }) {
  if (!assetId) return;
  const existing = await MediaAssetUsage.findOne({ assetId, usedInType, usedInId });
  if (existing) {
    if (existing.label !== label) {
      existing.label = label;
      await existing.save();
    }
    return;
  }
  await MediaAssetUsage.create({ assetId, usedInType, usedInId, label });
  await MediaAsset.updateOne({ assetId }, { $inc: { usageCount: 1 } });
}

export async function clearUsage(usedInType, usedInId) {
  const existing = await MediaAssetUsage.find({ usedInType, usedInId }).lean();
  if (!existing.length) return;
  await MediaAssetUsage.deleteMany({ usedInType, usedInId });
  const counts = new Map();
  for (const u of existing) counts.set(u.assetId, (counts.get(u.assetId) || 0) + 1);
  await Promise.all(
    [...counts.entries()].map(([assetId, count]) =>
      MediaAsset.updateOne({ assetId }, { $inc: { usageCount: -count } })
    )
  );
}

export async function listUsage(assetId) {
  return MediaAssetUsage.find({ assetId }).lean();
}

/**
 * Clears every usage record whose usedInId starts with `${idPrefix}:` (e.g.
 * all sections of one page) — used when a whole page's sections are resaved
 * at once, so additions/removals/changes don't leave stale "Used in" entries.
 */
export async function clearUsageByIdPrefix(usedInType, idPrefix) {
  const existing = await MediaAssetUsage.find({
    usedInType,
    usedInId: { $regex: `^${idPrefix}:` },
  }).lean();
  if (!existing.length) return;
  await MediaAssetUsage.deleteMany({ usedInType, usedInId: { $regex: `^${idPrefix}:` } });
  const counts = new Map();
  for (const u of existing) counts.set(u.assetId, (counts.get(u.assetId) || 0) + 1);
  await Promise.all(
    [...counts.entries()].map(([assetId, count]) =>
      MediaAsset.updateOne({ assetId }, { $inc: { usageCount: -count } })
    )
  );
}

/** Re-derives image usage for a whole page from its current sections (and
 * optional SEO OG image) in one pass: clears old entries, records fresh ones
 * for every images.*.assetId found. Call after any save that replaces a
 * page's section array wholesale. */
export async function syncPageImageUsage(slug, sections = [], seo = null) {
  await clearUsageByIdPrefix("page_section", slug);
  for (const section of sections) {
    const images = section.images || {};
    for (const [slot, image] of Object.entries(images)) {
      if (image?.assetId) {
        // eslint-disable-next-line no-await-in-loop
        await recordUsage(image.assetId, {
          usedInType: "page_section",
          usedInId: `${slug}:${section.sectionId}`,
          label: `${section.title || section.sectionType} (${slot})`,
        });
      }
    }
  }

  if (seo?.ogImage?.assetId) {
    await recordUsage(seo.ogImage.assetId, {
      usedInType: "seo_og_image",
      usedInId: slug,
      label: `${slug} (SEO OG image)`,
    });
  } else {
    await clearUsage("seo_og_image", slug);
  }
}

export async function deleteAsset(assetId) {
  const usage = await listUsage(assetId);
  if (usage.length) {
    const err = new Error(
      `Cannot delete — still used in ${usage.length} place(s): ${usage.map((u) => u.label || u.usedInId).join(", ")}.`
    );
    err.status = 409;
    err.usage = usage;
    throw err;
  }
  const asset = await MediaAsset.findOne({ assetId }).lean();
  if (!asset) return;
  const client = getS3Client();
  const keys = [asset.originalKey, asset.webpKey, asset.mobileKey, asset.thumbnailKey].filter(Boolean);
  await Promise.all(
    keys.map((key) => client.send(new DeleteObjectCommand({ Bucket: env.aws.s3Bucket, Key: key })).catch(() => {}))
  );
  await MediaAsset.deleteOne({ assetId });
}

export { MEDIA_PUBLIC_CATEGORIES };
