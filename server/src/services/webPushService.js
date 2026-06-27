import webpush from "web-push";
import env from "../config/env.js";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!env.vapid.publicKey || !env.vapid.privateKey) {
    const err = new Error("Push notifications are not configured (VAPID keys missing).");
    err.status = 503;
    throw err;
  }
  webpush.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);
  configured = true;
}

export function isPushConfigured() {
  return Boolean(env.vapid.publicKey && env.vapid.privateKey);
}

export function getVapidPublicKey() {
  return env.vapid.publicKey || "";
}

export async function sendPush(subscription, payload) {
  ensureConfigured();
  const body = JSON.stringify(payload);
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: subscription.keys },
      body
    );
    return { sent: true };
  } catch (error) {
    // 404/410 means the browser unsubscribed or the subscription expired —
    // the caller deletes the stale PushSubscription on this signal.
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { sent: false, expired: true };
    }
    throw error;
  }
}
