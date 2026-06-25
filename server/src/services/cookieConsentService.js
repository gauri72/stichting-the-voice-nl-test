import CookieConsent from "../models/CookieConsent.js";

export const CONSENT_VERSION = "1.0";
export const CONSENT_METHODS = ["accept_all", "reject_all", "custom", "withdrawn"];

export function normalizeCategories(rawCategories) {
  const categories = rawCategories && typeof rawCategories === "object" ? rawCategories : {};
  return {
    necessary: true,
    functional: Boolean(categories.functional),
    analytics: Boolean(categories.analytics),
    marketing: Boolean(categories.marketing),
  };
}

export function validateConsentPayload(body) {
  const method = body?.method;
  if (!CONSENT_METHODS.includes(method)) {
    return `method must be one of: ${CONSENT_METHODS.join(", ")}`;
  }
  if (!body?.userId && !body?.anonymousId) {
    return "Either userId or anonymousId is required.";
  }
  return null;
}

export function buildConsentRecord({ body, userId, ipAddress, userAgent }) {
  return {
    userId: userId || null,
    anonymousId: userId ? null : String(body.anonymousId).slice(0, 100),
    categories: normalizeCategories(body.categories),
    doNotSell: Boolean(body.doNotSell),
    method: body.method,
    consentVersion: body.consentVersion || CONSENT_VERSION,
    ipAddress: ipAddress || "",
    userAgent: (userAgent || "").slice(0, 300),
  };
}

export async function saveConsentRecord(params) {
  const record = buildConsentRecord(params);
  return CookieConsent.create(record);
}

export async function getLatestConsentForUser(userId) {
  return CookieConsent.findOne({ userId }).sort({ createdAt: -1 }).lean();
}

const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export function isConsentRecordExpired(record, now = Date.now()) {
  if (!record?.createdAt) return true;
  const createdAt = new Date(record.createdAt).getTime();
  return now - createdAt > CONSENT_TTL_MS;
}
