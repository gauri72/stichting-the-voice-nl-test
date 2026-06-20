import {
  detectByEmail as unifiedDetectByEmail,
  detectByUserId as unifiedDetectByUserId,
  getMembershipStatus as unifiedGetMembershipStatus,
  MEMBERSHIP_STATUS,
  MEMBERSHIP_SOURCE,
} from "./membershipDetectionService.js";
import { detectMembershipForCheckout } from "./ticketTailorMembershipService.js";

export const MEMBER_STATES = {
  GUEST_UNKNOWN: "GUEST_UNKNOWN",
  LOGGED_IN_ACTIVE_MEMBER: "LOGGED_IN_ACTIVE_MEMBER",
  LOGGED_IN_EXPIRED_MEMBER: "LOGGED_IN_EXPIRED_MEMBER",
  LOGGED_IN_NON_MEMBER: "LOGGED_IN_NON_MEMBER",
  GUEST_EMAIL_ACTIVE_MEMBER: "GUEST_EMAIL_ACTIVE_MEMBER",
  GUEST_EMAIL_EXPIRED_MEMBER: "GUEST_EMAIL_EXPIRED_MEMBER",
  GUEST_EMAIL_NON_MEMBER: "GUEST_EMAIL_NON_MEMBER",
};

function mapToMemberState(unified, isLoggedIn) {
  if (unified.status === MEMBERSHIP_STATUS.ACTIVE) {
    return isLoggedIn
      ? MEMBER_STATES.LOGGED_IN_ACTIVE_MEMBER
      : MEMBER_STATES.GUEST_EMAIL_ACTIVE_MEMBER;
  }
  if (unified.status === MEMBERSHIP_STATUS.EXPIRED) {
    return isLoggedIn
      ? MEMBER_STATES.LOGGED_IN_EXPIRED_MEMBER
      : MEMBER_STATES.GUEST_EMAIL_EXPIRED_MEMBER;
  }
  if (unified.status === MEMBERSHIP_STATUS.NON_MEMBER) {
    return isLoggedIn
      ? MEMBER_STATES.LOGGED_IN_NON_MEMBER
      : MEMBER_STATES.GUEST_EMAIL_NON_MEMBER;
  }
  return MEMBER_STATES.GUEST_UNKNOWN;
}

function wrapUnified(unified, isLoggedIn) {
  const checkoutStatus = mapToMemberState(unified, isLoggedIn);
  return {
    ...unified,
    membershipStatus: unified.status,
    status: checkoutStatus,
    membership: unified.membership,
    isActive: unified.isActive,
    isExpired: unified.isExpired,
    requiresLogin: unified.requiresLogin,
    requiresAccountLinking: unified.requiresAccountLinking,
  };
}

export async function detectByUserId(userId, options = {}) {
  if (!userId) {
    return {
      status: MEMBER_STATES.GUEST_UNKNOWN,
      membership: null,
      isActive: false,
      isExpired: false,
      found: false,
      source: "NONE",
    };
  }
  const unified = await unifiedDetectByUserId(userId, {
    email: options.email,
    isLoggedIn: true,
  });
  return wrapUnified(unified, true);
}

export async function detectByEmail(email, options = {}) {
  const unified = await unifiedDetectByEmail(email, {
    isLoggedIn: Boolean(options.isLoggedIn),
  });
  return wrapUnified(unified, Boolean(options.isLoggedIn));
}

export async function getMembershipStatus({ userId, email, isLoggedIn }) {
  const unified = await unifiedGetMembershipStatus({ userId, email, isLoggedIn });
  return wrapUnified(unified, Boolean(isLoggedIn && userId));
}

export async function detectMemberStatus({ userId, email, isLoggedIn, membershipCode = null }) {
  const detection = await detectMembershipForCheckout(email, userId, {
    isLoggedIn: Boolean(isLoggedIn && userId),
    membershipCode,
  });
  return wrapUnified(detection, Boolean(isLoggedIn && userId));
}

export { detectMembershipForCheckout } from "./ticketTailorMembershipService.js";

export {
  detectByEmail as detectMembershipByEmail,
  detectByUserId as detectMembershipByUserId,
  getMembershipStatus as getUnifiedMembershipStatus,
} from "./membershipDetectionService.js";
