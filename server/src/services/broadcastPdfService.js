import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import puppeteer from "puppeteer";
import env from "../config/env.js";
import EmailBroadcast from "../models/EmailBroadcast.js";
import EmailBroadcastLink from "../models/EmailBroadcastLink.js";
import { getS3Client, isMediaStorageConfigured } from "./mediaStorageService.js";

// Bumped whenever the rendering/sanitization logic below changes in a way that would make
// an already-generated PDF stale — the caller (broadcastPdfController.js) compares this
// against EmailBroadcast.pdfAsset.version to decide "reuse the existing file" vs.
// "regenerate", per the reuse-not-regenerate requirement.
export const PDF_GENERATION_VERSION = 1;

function slugifyFilename(value) {
  return String(value || "broadcast")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildPdfFilename(broadcast) {
  const name = slugifyFilename(broadcast.campaignName || broadcast.templateName);
  const date = broadcast.sentAt ? new Date(broadcast.sentAt).toISOString().slice(0, 10) : "unsent";
  return `VOICE-NL-${name}-${date}.pdf`;
}

/**
 * Strips every personal/recipient trace from the immutable send-time snapshot before it's
 * rendered. In the normal case this is mostly a no-op — sendBroadcast() already stores
 * htmlSnapshot rendered with only DEFAULT_MERGE_VARIABLES (never a real recipient's name,
 * email, or tracking token), so there's no real PII to strip. This exists as a second,
 * independent safety net rather than trusting that invariant alone: if a template author
 * hand-wrote a merge field this pass doesn't already substitute, the placeholder is at
 * least replaced with a safe fallback instead of leaking `{{...}}` syntax into the PDF.
 */
async function sanitizeHtmlForPdf(html, broadcastId) {
  let sanitized = html
    .replace(/\{\{\s*first_name\s*\}\}/gi, "V.O.I.C.E. NL Member")
    .replace(/\{\{\s*(last_name|full_name|recipient_name)\s*\}\}/gi, "")
    .replace(/\{\{\s*email\s*\}\}/gi, "")
    .replace(/\{\{\s*(discount_code|referral_code)\s*\}\}/gi, "your code")
    .replace(/\{\{\s*wallet_balance\s*\}\}/gi, "Your V.Wallet Balance")
    .replace(/\{\{\s*reward_points\s*\}\}/gi, "Your Reward Points")
    .replace(/\{\{\s*[a-z0-9_]+\s*\}\}/gi, ""); // catch-all for any other stray merge field

  // The snapshot never had tracking links injected in the first place (see the comment in
  // broadcastService.js::sendBroadcast), so resolving link tokens here is a defensive
  // no-op today — kept so this stays correct if that storage decision ever changes.
  const links = await EmailBroadcastLink.find({ broadcastId }).select("linkToken originalUrl").lean();
  for (const link of links) {
    sanitized = sanitized.split(link.linkToken).join(link.originalUrl);
  }

  return sanitized;
}

// One headless browser instance reused across generations rather than launching fresh per
// PDF — Puppeteer's launch cost is significant, and this service only ever runs inside the
// single-process in-process scheduler (see broadcastPdfScheduler.js), never concurrently
// across workers, so a module-level singleton is safe here.
let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      // --no-sandbox is required in most containerized hosting environments (including
      // Render) where the default Chromium sandbox can't set up correctly under the
      // container's restricted permissions.
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

async function renderPdfBuffer(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<div style="font-size:8px;width:100%;text-align:center;color:#94a3b8;">Stichting The V.O.I.C.E. NL &middot; <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
    });
  } finally {
    await page.close();
  }
}

function pdfS3Key(broadcastId) {
  return `private/broadcast-pdfs/${broadcastId}.pdf`;
}

/** Always generates (and overwrites any existing file) — callers decide whether generation
 * is actually needed via shouldRegeneratePdf() below before invoking this. */
export async function generateBroadcastPdf(broadcastId) {
  const broadcast = await EmailBroadcast.findById(broadcastId);
  if (!broadcast) {
    const error = new Error("Broadcast not found.");
    error.status = 404;
    throw error;
  }
  if (!broadcast.htmlSnapshot) {
    const error = new Error("This broadcast has no stored content to export yet.");
    error.status = 400;
    throw error;
  }
  if (!isMediaStorageConfigured()) {
    const error = new Error("File storage is not configured on the server.");
    error.status = 503;
    throw error;
  }

  broadcast.pdfStatus = "generating";
  broadcast.pdfError = "";
  await broadcast.save();

  try {
    const html = await sanitizeHtmlForPdf(broadcast.htmlSnapshot, broadcast._id);
    const buffer = await renderPdfBuffer(html);
    const key = pdfS3Key(broadcast._id);

    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: env.aws.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf",
        Metadata: {
          title: broadcast.subject.slice(0, 200),
          author: "Stichting The V.O.I.C.E. NL",
          subject: (broadcast.campaignName || broadcast.templateName).slice(0, 200),
        },
      })
    );

    broadcast.pdfAsset = { s3Key: key, generatedAt: new Date(), version: PDF_GENERATION_VERSION };
    broadcast.pdfStatus = "ready";
    broadcast.pdfError = "";
    await broadcast.save();
    return broadcast.pdfAsset;
  } catch (error) {
    broadcast.pdfStatus = "error";
    broadcast.pdfError = (error.message || "PDF generation failed.").slice(0, 500);
    await broadcast.save();
    throw error;
  }
}

/** Reuse-not-regenerate: only true when there's genuinely nothing usable cached yet, or the
 * rendering logic has moved on since the cached file was made. */
export function shouldRegeneratePdf(broadcast) {
  if (broadcast.pdfStatus === "ready" && broadcast.pdfAsset?.s3Key) {
    return broadcast.pdfAsset.version !== PDF_GENERATION_VERSION;
  }
  return broadcast.pdfStatus !== "generating" && broadcast.pdfStatus !== "queued";
}

export async function getPdfDownloadUrl(broadcastId) {
  const broadcast = await EmailBroadcast.findById(broadcastId).lean();
  if (!broadcast || broadcast.pdfStatus !== "ready" || !broadcast.pdfAsset?.s3Key) {
    const error = new Error("No PDF has been generated for this broadcast yet.");
    error.status = 404;
    throw error;
  }
  const client = getS3Client();
  const filename = buildPdfFilename(broadcast);
  const command = new GetObjectCommand({
    Bucket: env.aws.s3Bucket,
    Key: broadcast.pdfAsset.s3Key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  // Short-lived signed URL rather than a permanent public bucket URL — long enough for the
  // browser to start the download, short enough that a leaked link doesn't stay valid
  // indefinitely, satisfying "admin-only, no raw public storage URL" without proxying the
  // whole file through this Node process.
  return getSignedUrl(client, command, { expiresIn: 300 });
}
