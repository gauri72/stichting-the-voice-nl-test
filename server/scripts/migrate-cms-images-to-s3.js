/**
 * Migrates existing base64-data-URL images on CMS pages (draftSections,
 * publishedSections, seo.ogImage) to S3 + CloudFront.
 *
 * Dry-run by default — prints what would change without writing anything.
 * Pass --apply to actually upload + rewrite the Page documents.
 *
 * Usage:
 *   npm run migrate:cms-images            # dry run
 *   npm run migrate:cms-images -- --apply # real migration
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";
import Page from "../src/models/Page.js";
import { uploadAsset, isMediaStorageConfigured, syncPageImageUsage } from "../src/services/mediaStorageService.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");

function isBase64Image(image) {
  return typeof image?.url === "string" && image.url.startsWith("data:");
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}

async function migrateImageField(image, label) {
  const parsed = parseDataUrl(image.url);
  if (!parsed) {
    console.warn(`  ! ${label}: could not parse data URL, skipping`);
    return image;
  }
  console.log(`  -> ${label}: ${parsed.buffer.length} bytes, ${parsed.mimeType}`);
  if (!APPLY) return image;

  const asset = await uploadAsset(parsed.buffer, {
    category: "cms",
    visibility: "public",
    alt: image.alt || "",
    mimeType: parsed.mimeType,
  });
  return {
    ...image,
    url: asset.originalUrl,
    originalUrl: asset.originalUrl,
    optimizedUrl: asset.webpUrl || asset.originalUrl,
    assetId: asset.assetId,
  };
}

async function migrateSections(sections, pageSlug, label) {
  let changed = 0;
  for (const section of sections) {
    const images = section.images || {};
    for (const [slot, image] of Object.entries(images)) {
      if (isBase64Image(image)) {
        images[slot] = await migrateImageField(image, `${pageSlug} [${label}] ${section.sectionType}.${slot}`);
        changed += 1;
      }
    }
  }
  return changed;
}

async function main() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is not configured.");
  if (APPLY && !isMediaStorageConfigured()) {
    throw new Error("--apply requires AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY to be set.");
  }
  await connectDb(env.mongoUri, env.mongoDbName);

  console.log(APPLY ? "Running migration (writes will be made)..." : "Dry run — no writes will be made. Pass --apply to migrate for real.");

  const pages = await Page.find({});
  let totalChanged = 0;

  for (const page of pages) {
    const draftChanged = await migrateSections(page.draftSections || [], page.slug, "draft");
    const publishedChanged = await migrateSections(page.publishedSections || [], page.slug, "published");

    let seoChanged = 0;
    if (page.seo?.ogImage && isBase64Image(page.seo.ogImage)) {
      page.seo.ogImage = await migrateImageField(page.seo.ogImage, `${page.slug} [seo] ogImage`);
      seoChanged = 1;
    }

    const pageTotal = draftChanged + publishedChanged + seoChanged;
    totalChanged += pageTotal;

    if (APPLY && pageTotal > 0) {
      page.markModified("draftSections");
      page.markModified("publishedSections");
      page.markModified("seo");
      await page.save();
      await syncPageImageUsage(page.slug, page.draftSections, page.seo).catch((err) =>
        console.warn(`  ! usage sync failed for ${page.slug}:`, err.message)
      );
    }
  }

  console.log(`\n${APPLY ? "Migrated" : "Would migrate"} ${totalChanged} image field(s) across ${pages.length} page(s).`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate-cms-images] Failed:", err);
  process.exit(1);
});
