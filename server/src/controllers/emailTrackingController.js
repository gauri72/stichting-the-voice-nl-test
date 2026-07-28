import {
  TRANSPARENT_GIF,
  recordOpen,
  recordClickAndResolveUrl,
  recordUnsubscribe,
} from "../services/emailTrackingService.js";

// These endpoints are public and unauthenticated (recipients hit them directly from their
// inbox) — every handler responds identically whether or not the token resolves, so a
// wrong/expired/guessed token can never be distinguished from a real one from the outside.

export async function emailOpenPixel(req, res) {
  try {
    await recordOpen(req.params.token, { ip: req.ip, userAgent: req.headers["user-agent"] });
  } catch (error) {
    console.error("[email-tracking] open pixel error:", error);
  }
  res.set("Content-Type", "image/gif");
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Content-Length", String(TRANSPARENT_GIF.length));
  return res.status(200).end(TRANSPARENT_GIF);
}

const SAFE_REDIRECT_PROTOCOLS = new Set(["http:", "https:"]);

export async function emailClickRedirect(req, res) {
  let destination = null;
  try {
    destination = await recordClickAndResolveUrl(req.params.linkToken, req.query.t, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("[email-tracking] click redirect error:", error);
  }

  if (!destination) return res.redirect(302, "/");

  try {
    const parsed = new URL(destination);
    if (!SAFE_REDIRECT_PROTOCOLS.has(parsed.protocol)) return res.redirect(302, "/");
  } catch {
    return res.redirect(302, "/");
  }

  return res.redirect(302, destination);
}

export async function emailUnsubscribe(req, res) {
  try {
    const result = await recordUnsubscribe(req.params.token);
    return res.status(200).send(unsubscribePage(result.ok));
  } catch (error) {
    console.error("[email-tracking] unsubscribe error:", error);
    return res.status(200).send(unsubscribePage(false));
  }
}

function unsubscribePage(success) {
  const message = success
    ? "You have been unsubscribed and will no longer receive broadcast emails from us."
    : "This unsubscribe link is no longer valid. If you continue to receive emails you did not expect, please contact us.";
  return `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe — Stichting The V.O.I.C.E. NL</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;text-align:center;color:#102438}</style>
</head><body><h1>Stichting The V.O.I.C.E. NL</h1><p>${message}</p></body></html>`;
}
