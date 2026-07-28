import crypto from "crypto";
import EmailBroadcast from "../models/EmailBroadcast.js";
import EmailBroadcastRecipient from "../models/EmailBroadcastRecipient.js";
import EmailBroadcastLink from "../models/EmailBroadcastLink.js";
import EmailTrackingEvent from "../models/EmailTrackingEvent.js";
import EmailUnsubscribe from "../models/EmailUnsubscribe.js";
import { generateTrackingToken, hashIp } from "../utils/trackingToken.js";

// A single transparent 1x1 GIF, served for every open-pixel request regardless of whether
// the token resolves — an unrecognized-token response must look identical to a real one,
// otherwise the endpoint becomes a token-enumeration oracle.
export const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7",
  "base64"
);

// Engagement only ever moves forward — a late "opened" event (e.g. a delayed image proxy
// re-fetching the pixel) must never downgrade a recipient who already clicked.
const STATUS_RANK = {
  queued: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  soft_bounced: 4,
  hard_bounced: 4,
  failed: 4,
  rejected: 4,
  complained: 5,
  unsubscribed: 5,
};

function advanceStatus(current, next) {
  return (STATUS_RANK[next] ?? 0) > (STATUS_RANK[current] ?? 0) ? next : current;
}

export async function recordOpen(trackingIdentifier, { ip, userAgent } = {}) {
  const recipient = await EmailBroadcastRecipient.findOne({ trackingIdentifier });
  if (!recipient) return; // respond with the pixel regardless — no oracle behavior

  const now = new Date();
  const wasUnopened = !recipient.firstOpenedAt;
  recipient.firstOpenedAt = recipient.firstOpenedAt || now;
  recipient.lastOpenedAt = now;
  recipient.openCount += 1;
  recipient.status = advanceStatus(recipient.status, "opened");
  await recipient.save();

  await EmailTrackingEvent.create({
    broadcastId: recipient.broadcastId,
    recipientId: recipient._id,
    eventType: "opened",
    trackingIdentifier,
    ipHash: hashIp(ip),
    userAgent: String(userAgent || "").slice(0, 400),
  });

  if (wasUnopened) {
    await EmailBroadcast.updateOne({ _id: recipient.broadcastId }, { $inc: { openedCount: 1 } });
  }
}

export async function recordClickAndResolveUrl(linkToken, trackingIdentifier, { ip, userAgent } = {}) {
  const link = await EmailBroadcastLink.findOne({ linkToken });
  if (!link) return null;

  const recipient = trackingIdentifier
    ? await EmailBroadcastRecipient.findOne({ trackingIdentifier })
    : null;

  const now = new Date();
  let recipientIsFirstClickOnThisLink = true;

  if (recipient) {
    const wasUnclicked = !recipient.firstClickedAt;
    recipientIsFirstClickOnThisLink = wasUnclicked;
    recipient.firstClickedAt = recipient.firstClickedAt || now;
    recipient.lastClickedAt = now;
    recipient.clickCount += 1;
    recipient.status = advanceStatus(recipient.status, "clicked");
    await recipient.save();

    if (wasUnclicked) {
      await EmailBroadcast.updateOne({ _id: link.broadcastId }, { $inc: { clickedCount: 1 } });
    }

    await EmailTrackingEvent.create({
      broadcastId: link.broadcastId,
      recipientId: recipient._id,
      linkId: link._id,
      eventType: "clicked",
      trackingIdentifier,
      ipHash: hashIp(ip),
      userAgent: String(userAgent || "").slice(0, 400),
    });
  }

  await EmailBroadcastLink.updateOne(
    { _id: link._id },
    {
      $inc: {
        totalClicks: 1,
        uniqueClicks: recipient && recipientIsFirstClickOnThisLink ? 1 : 0,
      },
    }
  );

  return link.originalUrl;
}

export async function recordUnsubscribe(trackingIdentifier) {
  const recipient = await EmailBroadcastRecipient.findOne({ trackingIdentifier });
  if (!recipient) return { ok: false };

  recipient.status = "unsubscribed";
  await recipient.save();

  const existing = await EmailUnsubscribe.findOne({ email: recipient.email });
  if (!existing) {
    await EmailUnsubscribe.create({
      email: recipient.email,
      unsubscribeToken: crypto.randomUUID(),
      broadcastId: recipient.broadcastId,
    });
    await EmailBroadcast.updateOne({ _id: recipient.broadcastId }, { $inc: { unsubscribedCount: 1 } });
  }

  await EmailTrackingEvent.create({
    broadcastId: recipient.broadcastId,
    recipientId: recipient._id,
    eventType: "unsubscribed",
    trackingIdentifier,
  });

  return { ok: true, email: recipient.email };
}

export async function isUnsubscribed(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  const existing = await EmailUnsubscribe.findOne({ email: normalized }).select("_id").lean();
  return Boolean(existing);
}

/** One bulk query instead of one-per-recipient — used by sendBroadcast() to filter an
 * entire audience list in a single round trip regardless of list size. */
export async function getUnsubscribedEmailSet(emails) {
  const normalized = [...new Set(emails.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))];
  if (!normalized.length) return new Set();
  const rows = await EmailUnsubscribe.find({ email: { $in: normalized } }).select("email").lean();
  return new Set(rows.map((r) => r.email));
}

/**
 * Rewrites every <a href="..."> in the rendered HTML to a tracked click-redirect URL and
 * appends an invisible open-tracking pixel before </body>. One EmailBroadcastLink row is
 * created per distinct destination URL for the whole broadcast (not per recipient) — the
 * per-recipient identity travels separately as the `t` query param, generated fresh for
 * each recipient by the caller and passed in via `trackingIdentifier`.
 */
const HREF_REGEX = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>/gi;

function isTrackableHref(url) {
  const trimmed = url.trim();
  return Boolean(trimmed) && !trimmed.startsWith("#") && !trimmed.startsWith("mailto:") && !trimmed.startsWith("tel:");
}

export async function injectTracking(html, { broadcastId, publicApiUrl, trackingIdentifier }) {
  // originalUrl -> linkToken. A regex .replace() callback can't be async, so distinct URLs
  // are resolved/created up front, then substituted in a single synchronous pass.
  const seenUrls = new Map();
  const urls = [];
  let match;
  HREF_REGEX.lastIndex = 0;
  while ((match = HREF_REGEX.exec(html)) !== null) {
    const trimmed = match[2].trim();
    if (!isTrackableHref(match[2])) continue;
    if (!seenUrls.has(trimmed)) {
      seenUrls.set(trimmed, null);
      urls.push(trimmed);
    }
  }

  for (const url of urls) {
    // One EmailBroadcastLink row per distinct URL per broadcast, shared across every
    // recipient — findOneAndUpdate upsert so a repeated send/retry never double-creates it.
    // eslint-disable-next-line no-await-in-loop
    const link = await EmailBroadcastLink.findOneAndUpdate(
      { broadcastId, originalUrl: url },
      { $setOnInsert: { broadcastId, originalUrl: url, linkToken: generateTrackingToken() } },
      { upsert: true, new: true }
    );
    seenUrls.set(url, link.linkToken);
  }

  const rewritten = html.replace(HREF_REGEX, (fullMatch, quote, url) => {
    const token = seenUrls.get(url.trim());
    if (!token) return fullMatch;
    const trackedUrl = `${publicApiUrl}/api/email/click/${token}?t=${trackingIdentifier}`;
    return fullMatch.replace(`${quote}${url}${quote}`, `${quote}${trackedUrl}${quote}`);
  });

  const pixel = `<img src="${publicApiUrl}/api/email/open/${trackingIdentifier}.gif" width="1" height="1" alt="" style="display:none;" />`;
  if (/<\/body>/i.test(rewritten)) {
    rewritten = rewritten.replace(/<\/body>/i, `${pixel}</body>`);
  } else {
    rewritten = `${rewritten}${pixel}`;
  }

  return rewritten;
}
