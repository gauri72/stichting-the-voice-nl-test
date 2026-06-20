import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import PastData from "../models/PastData.js";
import TicketTailorBooking from "../models/TicketTailorBooking.js";
import { resolvePlanId, getPlan } from "../config/membershipPlans.js";
import { DEFAULT_MEMBERSHIP_TICKET_KEYWORDS } from "../config/checkoutDefaults.js";
import { getMembershipCheckoutSettings } from "./membershipCheckoutSettingsService.js";
import { inferPlanIdFromTitle } from "./membershipService.js";
import {
  isTicketTailorConfigured,
  loadTicketTailorAccountData,
  getTicketTailorStatus,
} from "./ticketTailorService.js";

export const MEMBERSHIP_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  NON_MEMBER: "NON_MEMBER",
  UNKNOWN: "UNKNOWN",
};

export const MEMBERSHIP_SOURCE = {
  LOCAL: "LOCAL",
  TICKETTAILOR: "TICKETTAILOR",
  BOTH: "BOTH",
  NONE: "NONE",
};

const AMSTERDAM_TZ = "Europe/Amsterdam";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function logDetection(tag, payload = {}) {
  const parts = Object.entries(payload)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[${tag}] ${parts}`);
}

function formatAmsterdamDate(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AMSTERDAM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function isDateActiveUntil(memberUntil, now = new Date()) {
  if (!memberUntil) return false;
  const untilStr = formatAmsterdamDate(memberUntil);
  const nowStr = formatAmsterdamDate(now);
  if (!untilStr || !nowStr) return false;
  return untilStr >= nowStr;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesMembershipKeyword(text, keywords) {
  const blob = String(text || "").toLowerCase();
  if (!blob) return false;
  return keywords.some((kw) => blob.includes(String(kw).toLowerCase()));
}

function normalizeRecord({
  planId,
  planName,
  memberUntil,
  memberFrom = null,
  active,
  source,
  membershipNumber = "",
  memberId = null,
  userId = null,
  email = "",
}) {
  return {
    planId: resolvePlanId(planId),
    planName: planName || getPlan(planId)?.name || "",
    memberUntil: memberUntil ? new Date(memberUntil) : null,
    memberFrom: memberFrom ? new Date(memberFrom) : null,
    memberUntilFormatted: formatAmsterdamDate(memberUntil),
    active: Boolean(active),
    source,
    membershipNumber,
    memberId,
    userId,
    email,
  };
}

async function lookupLocalByUserId(userId) {
  logDetection("LOCAL_MEMBERSHIP_LOOKUP_STARTED", { userId: userId?.toString?.() || userId });

  const membership = await Membership.findOne({
    userId,
    active: true,
    endsAt: { $gt: new Date() },
  })
    .sort({ endsAt: -1 })
    .lean();

  if (membership) {
    const active = isDateActiveUntil(membership.endsAt);
    logDetection("LOCAL_MEMBERSHIP_FOUND", { userId, planId: membership.planId, active });
    return normalizeRecord({
      planId: membership.planId,
      planName: membership.planName,
      memberUntil: membership.endsAt,
      memberFrom: membership.startedAt,
      active,
      source: MEMBERSHIP_SOURCE.LOCAL,
      membershipNumber: membership.membershipNumber || "",
      userId,
    });
  }

  const member = await Member.findOne({
    userId,
    membershipStatus: "active",
    expiryDate: { $gt: new Date() },
  })
    .sort({ expiryDate: -1 })
    .lean();

  if (member) {
    const active =
      member.membershipStatus === "active" && isDateActiveUntil(member.expiryDate);
    logDetection("LOCAL_MEMBERSHIP_FOUND", { userId, planId: member.planId, active });
    return normalizeRecord({
      planId: member.planId || member.membershipType,
      planName: member.membershipType,
      memberUntil: member.expiryDate,
      memberFrom: member.startDate,
      active,
      source: MEMBERSHIP_SOURCE.LOCAL,
      membershipNumber: member.membershipId,
      memberId: member._id?.toString(),
      userId,
      email: member.email,
    });
  }

  logDetection("LOCAL_MEMBERSHIP_NOT_FOUND", { userId });
  return null;
}

async function lookupLocalExpiredByUserId(userId) {
  const membership = await Membership.findOne({ userId }).sort({ endsAt: -1 }).lean();
  if (membership && !isDateActiveUntil(membership.endsAt)) {
    return normalizeRecord({
      planId: membership.planId,
      planName: membership.planName,
      memberUntil: membership.endsAt,
      memberFrom: membership.startedAt,
      active: false,
      source: MEMBERSHIP_SOURCE.LOCAL,
      membershipNumber: membership.membershipNumber || "",
      userId,
    });
  }

  const member = await Member.findOne({ userId }).sort({ expiryDate: -1 }).lean();
  if (member && !isDateActiveUntil(member.expiryDate)) {
    return normalizeRecord({
      planId: member.planId || member.membershipType,
      planName: member.membershipType,
      memberUntil: member.expiryDate,
      memberFrom: member.startDate,
      active: false,
      source: MEMBERSHIP_SOURCE.LOCAL,
      membershipNumber: member.membershipId,
      memberId: member._id?.toString(),
      userId,
      email: member.email,
    });
  }
  return null;
}

async function lookupLocalByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { active: null, expired: null };

  logDetection("LOCAL_MEMBERSHIP_LOOKUP_STARTED", { email: normalized });

  const member = await Member.findOne({ email: normalized }).sort({ expiryDate: -1 }).lean();
  if (member) {
    const active =
      member.membershipStatus === "active" && isDateActiveUntil(member.expiryDate);
    const record = normalizeRecord({
      planId: member.planId || member.membershipType,
      planName: member.membershipType,
      memberUntil: member.expiryDate,
      memberFrom: member.startDate,
      active,
      source: MEMBERSHIP_SOURCE.LOCAL,
      membershipNumber: member.membershipId,
      memberId: member._id?.toString(),
      userId: member.userId?.toString() || null,
      email: normalized,
    });
    logDetection(active ? "LOCAL_MEMBERSHIP_FOUND" : "LOCAL_MEMBERSHIP_EXPIRED", {
      email: normalized,
      planId: record.planId,
    });
    return { active: active ? record : null, expired: active ? null : record };
  }

  const user = await User.findOne({ email: normalized }).select("_id").lean();
  if (user) {
    const active = await lookupLocalByUserId(user._id);
    if (active?.active) return { active, expired: null };
    const expired = await lookupLocalExpiredByUserId(user._id);
    return { active: null, expired };
  }

  logDetection("LOCAL_MEMBERSHIP_NOT_FOUND", { email: normalized });
  return { active: null, expired: null };
}

function evaluateIssuedMembershipRecord(issued, keywords) {
  if (!issued?.id) return null;
  const typeName = issued.membership_type_name || issued.membershipTypeName || "";
  if (typeName && !matchesMembershipKeyword(typeName, keywords)) {
    return null;
  }

  const validTo = issued.valid_to || issued.validTo;
  const validFrom = issued.valid_from || issued.validFrom;
  const voidedAt = issued.voided_at || issued.voidedAt;
  const isValid =
    (issued.is_valid === true || issued.isValid === true) && !voidedAt;

  const validToDate = validTo ? new Date(validTo) : null;
  const active = isValid && isDateActiveUntil(validToDate);

  const planId = inferPlanIdFromTitle(typeName);

  return normalizeRecord({
    planId,
    planName: typeName || getPlan(planId)?.name,
    memberUntil: validToDate,
    memberFrom: validFrom ? new Date(validFrom) : null,
    active,
    source: MEMBERSHIP_SOURCE.TICKETTAILOR,
    membershipNumber: String(issued.code || issued.id || "").trim(),
  });
}

async function lookupTicketTailorSynced(email, keywords) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { active: null, expired: null };

  logDetection("TICKETTAILOR_MEMBERSHIP_LOOKUP_STARTED", { email: normalized, mode: "synced" });

  const pastDoc = await PastData.findById(normalized).lean();
  let bestActive = null;
  let bestExpired = null;

  if (pastDoc?.issuedMemberships?.length) {
    for (const issued of pastDoc.issuedMemberships) {
      const record = evaluateIssuedMembershipRecord(issued, keywords);
      if (!record) continue;
      if (record.active && (!bestActive || record.memberUntil > bestActive.memberUntil)) {
        bestActive = record;
      } else if (!record.active && (!bestExpired || record.memberUntil > bestExpired.memberUntil)) {
        bestExpired = record;
      }
    }
  }

  if (!bestActive && !bestExpired && pastDoc?.orders?.length) {
    for (const order of pastDoc.orders) {
      if (order.category !== "membership") continue;
      const title = order.eventTitle || "";
      if (!matchesMembershipKeyword(title, keywords)) continue;
      const planId = inferPlanIdFromTitle(title);
      const plan = getPlan(planId);
      const startedAt = order.createdAt ? new Date(order.createdAt) : new Date();
      const endsAt = new Date(startedAt);
      endsAt.setFullYear(endsAt.getFullYear() + (plan?.durationYears || 1));
      const active = isDateActiveUntil(endsAt);
      const record = normalizeRecord({
        planId,
        planName: title,
        memberUntil: endsAt,
        memberFrom: startedAt,
        active,
        source: MEMBERSHIP_SOURCE.TICKETTAILOR,
        membershipNumber: order.id || "",
        email: normalized,
      });
      if (active) bestActive = record;
      else if (!bestExpired) bestExpired = record;
    }
  }

  const bookings = await TicketTailorBooking.find({ email: normalized }).lean();
  for (const booking of bookings) {
    const label = `${booking.eventName || ""} ${booking.ticketType || ""}`;
    if (!matchesMembershipKeyword(label, keywords)) continue;
    const planId = inferPlanIdFromTitle(label);
    const plan = getPlan(planId);
    const startedAt = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
    const endsAt = new Date(startedAt);
    endsAt.setFullYear(endsAt.getFullYear() + (plan?.durationYears || 1));
    const active =
      booking.bookingStatus === "confirmed" && isDateActiveUntil(endsAt);
    const record = normalizeRecord({
      planId,
      planName: booking.ticketType || booking.eventName,
      memberUntil: endsAt,
      memberFrom: startedAt,
      active,
      source: MEMBERSHIP_SOURCE.TICKETTAILOR,
      membershipNumber: booking.ticketTailorOrderId || "",
      email: normalized,
    });
    if (active && (!bestActive || record.memberUntil > bestActive.memberUntil)) {
      bestActive = record;
    } else if (!active && (!bestExpired || record.memberUntil > bestExpired.memberUntil)) {
      bestExpired = record;
    }
  }

  if (bestActive) {
    logDetection("TICKETTAILOR_MEMBERSHIP_FOUND", { email: normalized, mode: "synced", active: true });
    logDetection("TICKETTAILOR_MEMBERSHIP_ACTIVE", { email: normalized, planId: bestActive.planId });
  } else if (bestExpired) {
    logDetection("TICKETTAILOR_MEMBERSHIP_FOUND", { email: normalized, mode: "synced", active: false });
    logDetection("TICKETTAILOR_MEMBERSHIP_EXPIRED", { email: normalized, planId: bestExpired.planId });
  } else {
    logDetection("TICKETTAILOR_MEMBERSHIP_NOT_FOUND", { email: normalized, mode: "synced" });
  }

  return { active: bestActive, expired: bestExpired };
}

async function lookupTicketTailorLive(email, keywords, settings) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { active: null, expired: null };

  if (!settings.enableTicketTailorLookup) {
    return { active: null, expired: null };
  }

  if (!isTicketTailorConfigured()) {
    return { active: null, expired: null };
  }

  if (!settings.useLiveTicketTailorApi) {
    return { active: null, expired: null };
  }

  logDetection("TICKETTAILOR_MEMBERSHIP_LOOKUP_STARTED", { email: normalized, mode: "live_api" });

  try {
    const status = await getTicketTailorStatus();
    if (!status.buyerEmailVisible) {
      logDetection("TICKETTAILOR_SYNC_FALLBACK_USED", { email: normalized, reason: "pii_redacted" });
      return { active: null, expired: null };
    }

    const { orders, issuedMemberships } = await loadTicketTailorAccountData(normalized);
    let bestActive = null;
    let bestExpired = null;

    for (const issued of issuedMemberships || []) {
      const record = evaluateIssuedMembershipRecord(
        {
          id: issued.id,
          membership_type_name: issued.membershipTypeName,
          valid_from: issued.validFrom,
          valid_to: issued.validTo,
          is_valid: issued.isValid,
          voided_at: issued.voidedAt,
          code: issued.code,
        },
        keywords
      );
      if (!record) continue;
      if (record.active && (!bestActive || record.memberUntil > bestActive.memberUntil)) {
        bestActive = record;
      } else if (!record.active && (!bestExpired || record.memberUntil > bestExpired.memberUntil)) {
        bestExpired = record;
      }
    }

    for (const order of orders || []) {
      if (order.category !== "membership") continue;
      const title = order.eventTitle || "";
      if (!matchesMembershipKeyword(title, keywords)) continue;
      const planId = inferPlanIdFromTitle(title);
      const plan = getPlan(planId);
      const startedAt = order.createdAt ? new Date(order.createdAt) : new Date();
      const endsAt = new Date(startedAt);
      endsAt.setFullYear(endsAt.getFullYear() + (plan?.durationYears || 1));
      const active = isDateActiveUntil(endsAt);
      const record = normalizeRecord({
        planId,
        planName: title,
        memberUntil: endsAt,
        memberFrom: startedAt,
        active,
        source: MEMBERSHIP_SOURCE.TICKETTAILOR,
        membershipNumber: order.id || "",
        email: normalized,
      });
      if (active && (!bestActive || record.memberUntil > bestActive.memberUntil)) {
        bestActive = record;
      } else if (!active && (!bestExpired || record.memberUntil > bestExpired.memberUntil)) {
        bestExpired = record;
      }
    }

    if (bestActive) {
      logDetection("TICKETTAILOR_MEMBERSHIP_FOUND", { email: normalized, mode: "live_api", active: true });
      logDetection("TICKETTAILOR_MEMBERSHIP_ACTIVE", { email: normalized, planId: bestActive.planId });
    } else if (bestExpired) {
      logDetection("TICKETTAILOR_MEMBERSHIP_FOUND", { email: normalized, mode: "live_api", active: false });
      logDetection("TICKETTAILOR_MEMBERSHIP_EXPIRED", { email: normalized, planId: bestExpired.planId });
    } else {
      logDetection("TICKETTAILOR_MEMBERSHIP_NOT_FOUND", { email: normalized, mode: "live_api" });
    }

    return { active: bestActive, expired: bestExpired };
  } catch (error) {
    logDetection("TICKETTAILOR_API_FAILED", { email: normalized, error: error.message });
    return { active: null, expired: null, error: error.message };
  }
}

function mergeMembershipResults(local, ttSynced, ttLive, options = {}) {
  const ttFirst = options.checkTicketTailorBeforeLocal !== false;

  let active = null;
  let expired = null;
  let source = MEMBERSHIP_SOURCE.NONE;

  const localActive = local?.active;
  const ttActive = ttLive?.active || ttSynced?.active;
  const localExpired = local?.expired;
  const ttExpired = ttLive?.expired || ttSynced?.expired;

  if (ttFirst) {
    // Priority: 1) Active TT  2) Active Local  3) Expired TT  4) Expired Local
    if (ttActive?.active) {
      active = { ...ttActive, source: MEMBERSHIP_SOURCE.TICKETTAILOR };
      source = MEMBERSHIP_SOURCE.TICKETTAILOR;
      if (localActive?.active) {
        active.alternateLocalMembership = localActive;
      }
    } else if (localActive?.active) {
      active = { ...localActive, source: MEMBERSHIP_SOURCE.LOCAL };
      source = MEMBERSHIP_SOURCE.LOCAL;
    }

    if (!active) {
      if (ttExpired) {
        expired = { ...ttExpired, source: MEMBERSHIP_SOURCE.TICKETTAILOR };
        source = MEMBERSHIP_SOURCE.TICKETTAILOR;
      } else if (localExpired) {
        expired = { ...localExpired, source: MEMBERSHIP_SOURCE.LOCAL };
        source = MEMBERSHIP_SOURCE.LOCAL;
      }
    }
  } else {
    // Legacy: local active first, then TT
    if (localActive?.active) {
      active = { ...localActive, source: MEMBERSHIP_SOURCE.LOCAL };
      source = MEMBERSHIP_SOURCE.LOCAL;
    }
    if (ttActive?.active) {
      if (active) {
        active = { ...active, source: MEMBERSHIP_SOURCE.BOTH, ticketTailorMembership: ttActive };
        source = MEMBERSHIP_SOURCE.BOTH;
      } else {
        active = { ...ttActive, source: MEMBERSHIP_SOURCE.TICKETTAILOR };
        source = MEMBERSHIP_SOURCE.TICKETTAILOR;
      }
    }
    if (!active) {
      if (localExpired) {
        expired = { ...localExpired, source: MEMBERSHIP_SOURCE.LOCAL };
        source = MEMBERSHIP_SOURCE.LOCAL;
      }
      if (ttExpired) {
        if (expired) {
          expired = { ...expired, source: MEMBERSHIP_SOURCE.BOTH };
          source = MEMBERSHIP_SOURCE.BOTH;
        } else {
          expired = { ...ttExpired, source: MEMBERSHIP_SOURCE.TICKETTAILOR };
          source = MEMBERSHIP_SOURCE.TICKETTAILOR;
        }
      }
    }
  }

  if (active) {
    const logTag =
      source === MEMBERSHIP_SOURCE.TICKETTAILOR
        ? "MEMBERSHIP_PRIORITY_SELECTED_TICKETTAILOR"
        : "MEMBERSHIP_SOURCE_SELECTED";
    logDetection(logTag, {
      source,
      status: MEMBERSHIP_STATUS.ACTIVE,
      planId: active.planId,
    });
  } else if (expired) {
    logDetection("MEMBERSHIP_SOURCE_SELECTED", {
      source,
      status: MEMBERSHIP_STATUS.EXPIRED,
      planId: expired.planId,
    });
  }

  return { active, expired, source };
}

function buildDetectionResult({ active, expired, source, email, userId, isLoggedIn, sessionUserId = null, settings = null }) {
  const linkedUserId = sessionUserId || userId;
  const hasUserAccount = Boolean(linkedUserId);
  const requireLoginForTT =
    settings?.requireLoginForTicketTailorBenefits !== false;

  if (active) {
    const isTicketTailorSource =
      source === MEMBERSHIP_SOURCE.TICKETTAILOR || source === MEMBERSHIP_SOURCE.BOTH;
    const requiresLogin =
      !isLoggedIn &&
      (isTicketTailorSource ? requireLoginForTT : true);
    const requiresAccountLinking =
      !isLoggedIn &&
      !hasUserAccount &&
      (source === MEMBERSHIP_SOURCE.TICKETTAILOR || source === MEMBERSHIP_SOURCE.BOTH);

    logDetection("CHECKOUT_MEMBER_ACTIVE", {
      email,
      source,
      planId: active.planId,
      memberUntil: active.memberUntilFormatted,
    });

    return {
      found: true,
      status: MEMBERSHIP_STATUS.ACTIVE,
      source,
      membershipType: active.planName,
      memberUntil: active.memberUntilFormatted,
      memberUntilIso: active.memberUntil?.toISOString?.() || null,
      eligibleForBenefits: true,
      requiresLogin,
      requiresAccountLinking,
      membership: active,
      ticketTailorMembershipId:
        source === MEMBERSHIP_SOURCE.TICKETTAILOR ? active.membershipNumber || "" : "",
      isActive: true,
      isExpired: false,
      verificationWarning: null,
    };
  }

  if (expired) {
    logDetection("CHECKOUT_MEMBER_EXPIRED", {
      email,
      source,
      memberUntil: expired.memberUntilFormatted,
    });
    return {
      found: true,
      status: MEMBERSHIP_STATUS.EXPIRED,
      source,
      membershipType: expired.planName,
      memberUntil: expired.memberUntilFormatted,
      memberUntilIso: expired.memberUntil?.toISOString?.() || null,
      eligibleForBenefits: false,
      requiresLogin: false,
      requiresAccountLinking: false,
      membership: expired,
      isActive: false,
      isExpired: true,
      verificationWarning: null,
    };
  }

  logDetection("CHECKOUT_NON_MEMBER", { email });
  return {
    found: false,
    status: MEMBERSHIP_STATUS.NON_MEMBER,
    source: MEMBERSHIP_SOURCE.NONE,
    membershipType: "",
    memberUntil: "",
    memberUntilIso: null,
    eligibleForBenefits: false,
    requiresLogin: false,
    requiresAccountLinking: false,
    membership: null,
    isActive: false,
    isExpired: false,
    verificationWarning: null,
  };
}

export async function detectByMembershipCode(code, options = {}) {
  const normalizedCode = String(code || "").trim();
  if (!normalizedCode) {
    return {
      found: false,
      status: MEMBERSHIP_STATUS.NON_MEMBER,
      source: MEMBERSHIP_SOURCE.NONE,
      membershipType: "",
      memberUntil: "",
      eligibleForBenefits: false,
      requiresLogin: false,
      requiresAccountLinking: false,
      membership: null,
      isActive: false,
      isExpired: false,
      verificationWarning: null,
      codeValid: false,
      codeMessage: "Membership code is required.",
    };
  }

  const settings = options.settings || (await getMembershipCheckoutSettings());
  if (settings.enableMembershipCodeValidation === false) {
    const err = new Error("Membership code validation is disabled.");
    err.status = 403;
    throw err;
  }

  logDetection("MEMBERSHIP_CODE_ENTERED", { code: normalizedCode });
  logDetection("MEMBERSHIP_CODE_VALIDATION_STARTED", { code: normalizedCode });

  const codeRegex = new RegExp(`^${escapeRegex(normalizedCode)}$`, "i");
  const checkoutEmail = normalizeEmail(options.email || "");
  const isLoggedIn = Boolean(options.isLoggedIn);

  let record = null;

  const member = await Member.findOne({ membershipId: codeRegex }).lean();
  if (member) {
    if (member.membershipStatus === "cancelled") {
      logDetection("MEMBERSHIP_CODE_INVALID", { code: normalizedCode, reason: "cancelled" });
      return buildCodeValidationFailure("This membership code is invalid or expired.");
    }
    const active =
      member.membershipStatus === "active" && isDateActiveUntil(member.expiryDate);
    record = normalizeRecord({
      planId: member.planId || member.membershipType,
      planName: member.membershipType,
      memberUntil: member.expiryDate,
      memberFrom: member.startDate,
      active,
      source: MEMBERSHIP_SOURCE.LOCAL,
      membershipNumber: member.membershipId,
      memberId: member._id?.toString(),
      userId: member.userId?.toString() || null,
      email: member.email,
    });
  }

  if (!record) {
    const membership = await Membership.findOne({ membershipNumber: codeRegex }).lean();
    if (membership) {
      const active = membership.active && isDateActiveUntil(membership.endsAt);
      record = normalizeRecord({
        planId: membership.planId,
        planName: membership.planName,
        memberUntil: membership.endsAt,
        memberFrom: membership.startedAt,
        active,
        source: MEMBERSHIP_SOURCE.LOCAL,
        membershipNumber: membership.membershipNumber || "",
        userId: membership.userId?.toString() || null,
      });
    }
  }

  if (!record && checkoutEmail && settings.useSyncedTicketTailorData !== false) {
    const pastDoc = await PastData.findById(checkoutEmail).lean();
    for (const issued of pastDoc?.issuedMemberships || []) {
      const issuedCode = String(issued.code || issued.id || "").trim();
      if (!issuedCode || !codeRegex.test(issuedCode)) continue;
      const keywords = settings.membershipTicketKeywords || DEFAULT_MEMBERSHIP_TICKET_KEYWORDS;
      record = evaluateIssuedMembershipRecord(issued, keywords);
      if (record) break;
    }
  }

  if (!record) {
    logDetection("MEMBERSHIP_CODE_INVALID", { code: normalizedCode });
    return buildCodeValidationFailure("This membership code is invalid or expired.");
  }

  if (
    checkoutEmail &&
    record.email &&
    normalizeEmail(record.email) !== checkoutEmail
  ) {
    logDetection("MEMBERSHIP_CODE_INVALID", { code: normalizedCode, reason: "email_mismatch" });
    return {
      ...buildCodeValidationFailure(
        "This membership code does not match the email provided. Please log in with the account linked to this membership."
      ),
      requiresLogin: true,
      emailMismatch: true,
    };
  }

  if (!record.active) {
    logDetection("MEMBERSHIP_CODE_INVALID", { code: normalizedCode, reason: "expired" });
    return buildCodeValidationFailure("This membership code is invalid or expired.");
  }

  logDetection("MEMBERSHIP_CODE_VALID", {
    code: normalizedCode,
    planId: record.planId,
    memberUntil: record.memberUntilFormatted,
  });

  const result = buildDetectionResult({
    active: record,
    expired: null,
    source: record.source,
    email: record.email || checkoutEmail,
    userId: record.userId,
    isLoggedIn,
    sessionUserId: options.sessionUserId || null,
  });

  return {
    ...result,
    codeValid: true,
    codeMessage: "Membership Benefit Applied",
  };
}

function buildCodeValidationFailure(message) {
  return {
    found: false,
    status: MEMBERSHIP_STATUS.NON_MEMBER,
    source: MEMBERSHIP_SOURCE.NONE,
    membershipType: "",
    memberUntil: "",
    eligibleForBenefits: false,
    requiresLogin: false,
    requiresAccountLinking: false,
    membership: null,
    isActive: false,
    isExpired: false,
    verificationWarning: null,
    codeValid: false,
    codeMessage: message,
  };
}

export async function detectByEmail(email, options = {}) {
  const normalized = normalizeEmail(email);
  const settings = options.settings || (await getMembershipCheckoutSettings());
  const keywords = settings.membershipTicketKeywords || DEFAULT_MEMBERSHIP_TICKET_KEYWORDS;
  const isLoggedIn = Boolean(options.isLoggedIn);

  logDetection("CHECKOUT_MEMBER_DETECTION_STARTED", { email: normalized });

  if (!normalized) {
    return buildDetectionResult({
      active: null,
      expired: null,
      source: MEMBERSHIP_SOURCE.NONE,
      email: "",
      isLoggedIn,
    });
  }

  let local = { active: null, expired: null };
  let ttSynced = { active: null, expired: null };
  let ttLive = { active: null, expired: null };
  let verificationWarning = null;

  const ttFirst =
    settings.enableTicketTailorMembershipPriority !== false &&
    settings.checkTicketTailorBeforeLocal !== false;

  async function runTicketTailorLookups() {
    if (settings.useSyncedTicketTailorData !== false) {
      try {
        ttSynced = await lookupTicketTailorSynced(normalized, keywords);
      } catch (error) {
        logDetection("TICKETTAILOR_SYNC_LOOKUP_FAILED", { email: normalized, error: error.message });
      }
    }
    try {
      ttLive = await lookupTicketTailorLive(normalized, keywords, settings);
      if (ttLive.error && !ttSynced.active && !ttSynced.expired) {
        verificationWarning = verificationWarning || "Unable to verify TicketTailor membership at this moment.";
      }
    } catch (error) {
      logDetection("TICKETTAILOR_API_FAILED", { email: normalized, error: error.message });
    }
  }

  async function runLocalLookup() {
    try {
      local = await lookupLocalByEmail(normalized);
    } catch (error) {
      logDetection("LOCAL_MEMBERSHIP_LOOKUP_FAILED", { email: normalized, error: error.message });
      verificationWarning = "Unable to verify local membership at this moment.";
    }
  }

  if (ttFirst) {
    await runTicketTailorLookups();
    await runLocalLookup();
  } else {
    await runLocalLookup();
    await runTicketTailorLookups();
  }

  const merged = mergeMembershipResults(local, ttSynced, ttLive, {
    checkTicketTailorBeforeLocal:
      settings.enableTicketTailorMembershipPriority !== false &&
      settings.checkTicketTailorBeforeLocal !== false,
  });
  let result = buildDetectionResult({
    ...merged,
    email: normalized,
    userId: local.active?.userId || local.expired?.userId || null,
    isLoggedIn,
    sessionUserId: options.sessionUserId || null,
    settings,
  });

  if (options.membershipCode) {
    const codeResult = await detectByMembershipCode(options.membershipCode, {
      email: normalized,
      isLoggedIn,
      sessionUserId: options.sessionUserId || null,
      settings,
    });
    if (codeResult.codeValid && codeResult.status === MEMBERSHIP_STATUS.ACTIVE) {
      result = codeResult;
    }
  }

  logDetection("CHECK_MEMBERSHIP_LOOKUP", {
    email: normalized,
    localMembershipFound: Boolean(local.active || local.expired),
    ticketTailorMembershipFound: Boolean(
      ttSynced.active || ttSynced.expired || ttLive.active || ttLive.expired
    ),
    membershipSource: result.source,
    membershipType: result.membershipType,
    status: result.status,
    memberUntil: result.memberUntil,
    eligibleForBenefits: result.eligibleForBenefits,
  });

  if (verificationWarning && result.status === MEMBERSHIP_STATUS.NON_MEMBER) {
    result.verificationWarning = verificationWarning;
    result.status = MEMBERSHIP_STATUS.UNKNOWN;
  }

  return result;
}

export async function detectByUserId(userId, options = {}) {
  if (!userId) {
    return detectByEmail(options.email || "", options);
  }

  logDetection("CHECKOUT_MEMBER_DETECTION_STARTED", { userId: userId?.toString?.() });

  const settings = options.settings || (await getMembershipCheckoutSettings());

  // TicketTailor-first: check by email before falling back to local-only lookup
  if (options.email && settings.checkTicketTailorBeforeLocal !== false) {
    const emailResult = await detectByEmail(options.email, {
      ...options,
      isLoggedIn: true,
      sessionUserId: userId,
      settings,
    });
    if (emailResult.status === MEMBERSHIP_STATUS.ACTIVE) {
      return { ...emailResult, requiresLogin: false, requiresAccountLinking: false };
    }
    if (emailResult.status === MEMBERSHIP_STATUS.EXPIRED) {
      const localActive = await lookupLocalByUserId(userId);
      if (localActive?.active) {
        return buildDetectionResult({
          active: localActive,
          expired: null,
          source: MEMBERSHIP_SOURCE.LOCAL,
          email: localActive.email || options.email || "",
          userId,
          isLoggedIn: true,
          sessionUserId: userId,
          settings,
        });
      }
      return { ...emailResult, requiresLogin: false, requiresAccountLinking: false };
    }
  }

  const active = await lookupLocalByUserId(userId);
  if (active?.active) {
    return buildDetectionResult({
      active,
      expired: null,
      source: MEMBERSHIP_SOURCE.LOCAL,
      email: active.email || options.email || "",
      userId,
      isLoggedIn: true,
      sessionUserId: userId,
      settings,
    });
  }

  const expired = await lookupLocalExpiredByUserId(userId);

  if (options.email) {
    const emailResult = await detectByEmail(options.email, {
      ...options,
      isLoggedIn: true,
      sessionUserId: userId,
      settings,
    });
    if (emailResult.status === MEMBERSHIP_STATUS.ACTIVE) {
      return { ...emailResult, requiresLogin: false, requiresAccountLinking: false };
    }
    if (emailResult.status === MEMBERSHIP_STATUS.EXPIRED && !expired) {
      return { ...emailResult, requiresLogin: false, requiresAccountLinking: false };
    }
  }

  if (expired) {
    return buildDetectionResult({
      active: null,
      expired,
      source: MEMBERSHIP_SOURCE.LOCAL,
      email: expired.email || options.email || "",
      userId,
      isLoggedIn: true,
      sessionUserId: userId,
      settings,
    });
  }

  return buildDetectionResult({
    active: null,
    expired: null,
    source: MEMBERSHIP_SOURCE.NONE,
    email: options.email || "",
    userId,
    isLoggedIn: true,
    sessionUserId: userId,
    settings,
  });
}

export async function getMembershipStatus({ userId, email, isLoggedIn = false, membershipCode = null, sessionUserId = null }) {
  if (isLoggedIn && userId) {
    return detectByUserId(userId, { email, isLoggedIn: true, membershipCode, sessionUserId: userId });
  }
  if (email) {
    return detectByEmail(email, { isLoggedIn: false, membershipCode, sessionUserId });
  }
  return {
    found: false,
    status: MEMBERSHIP_STATUS.UNKNOWN,
    source: MEMBERSHIP_SOURCE.NONE,
    membershipType: "",
    memberUntil: "",
    eligibleForBenefits: false,
    requiresLogin: false,
    requiresAccountLinking: false,
    membership: null,
    isActive: false,
    isExpired: false,
  };
}
