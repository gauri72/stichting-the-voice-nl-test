import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import { resolvePlanId } from "../config/membershipPlans.js";

export const MEMBER_STATES = {
  GUEST_UNKNOWN: "GUEST_UNKNOWN",
  LOGGED_IN_ACTIVE_MEMBER: "LOGGED_IN_ACTIVE_MEMBER",
  LOGGED_IN_EXPIRED_MEMBER: "LOGGED_IN_EXPIRED_MEMBER",
  LOGGED_IN_NON_MEMBER: "LOGGED_IN_NON_MEMBER",
  GUEST_EMAIL_ACTIVE_MEMBER: "GUEST_EMAIL_ACTIVE_MEMBER",
  GUEST_EMAIL_EXPIRED_MEMBER: "GUEST_EMAIL_EXPIRED_MEMBER",
  GUEST_EMAIL_NON_MEMBER: "GUEST_EMAIL_NON_MEMBER",
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function findMembershipByUserId(userId) {
  if (!userId) return null;

  const membership = await Membership.findOne({
    userId,
    active: true,
    endsAt: { $gt: new Date() },
  })
    .sort({ endsAt: -1 })
    .lean();

  if (membership) {
    return {
      source: "membership",
      planId: resolvePlanId(membership.planId),
      planName: membership.planName || "",
      endsAt: membership.endsAt,
      startedAt: membership.startedAt,
      membershipNumber: membership.membershipNumber || "",
      active: true,
      userId,
    };
  }

  const member = await Member.findOne({
    userId,
    membershipStatus: "active",
    expiryDate: { $gt: new Date() },
  })
    .sort({ expiryDate: -1 })
    .lean();

  if (member) {
    return {
      source: "member",
      planId: resolvePlanId(member.planId || member.membershipType),
      planName: member.membershipType || "",
      endsAt: member.expiryDate,
      startedAt: member.startDate,
      membershipNumber: member.membershipId || "",
      memberId: member._id?.toString(),
      active: true,
      userId,
    };
  }

  return null;
}

async function findExpiredMembershipByUserId(userId) {
  if (!userId) return null;

  const membership = await Membership.findOne({ userId })
    .sort({ endsAt: -1 })
    .lean();

  if (membership && (!membership.active || new Date(membership.endsAt) <= new Date())) {
    return {
      source: "membership",
      planId: resolvePlanId(membership.planId),
      planName: membership.planName || "",
      endsAt: membership.endsAt,
      startedAt: membership.startedAt,
      membershipNumber: membership.membershipNumber || "",
      active: false,
      userId,
    };
  }

  const member = await Member.findOne({ userId })
    .sort({ expiryDate: -1 })
    .lean();

  if (
    member &&
    (member.membershipStatus === "expired" ||
      member.membershipStatus === "cancelled" ||
      new Date(member.expiryDate) <= new Date())
  ) {
    return {
      source: "member",
      planId: resolvePlanId(member.planId || member.membershipType),
      planName: member.membershipType || "",
      endsAt: member.expiryDate,
      startedAt: member.startDate,
      membershipNumber: member.membershipId || "",
      memberId: member._id?.toString(),
      active: false,
      userId,
    };
  }

  return null;
}

async function findMembershipByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const member = await Member.findOne({ email: normalized })
    .sort({ expiryDate: -1 })
    .lean();

  if (member) {
    const active =
      member.membershipStatus === "active" && new Date(member.expiryDate) > new Date();
    return {
      source: "member",
      planId: resolvePlanId(member.planId || member.membershipType),
      planName: member.membershipType || "",
      endsAt: member.expiryDate,
      startedAt: member.startDate,
      membershipNumber: member.membershipId || "",
      memberId: member._id?.toString(),
      active,
      email: normalized,
      userId: member.userId?.toString() || null,
    };
  }

  const user = await User.findOne({ email: normalized }).select("_id").lean();
  if (user) {
    return findMembershipByUserId(user._id);
  }

  return null;
}

export async function detectByUserId(userId) {
  if (!userId) {
    return {
      status: MEMBER_STATES.GUEST_UNKNOWN,
      membership: null,
      isActive: false,
      isExpired: false,
    };
  }

  const active = await findMembershipByUserId(userId);
  if (active) {
    return {
      status: MEMBER_STATES.LOGGED_IN_ACTIVE_MEMBER,
      membership: active,
      isActive: true,
      isExpired: false,
    };
  }

  const expired = await findExpiredMembershipByUserId(userId);
  if (expired) {
    return {
      status: MEMBER_STATES.LOGGED_IN_EXPIRED_MEMBER,
      membership: expired,
      isActive: false,
      isExpired: true,
    };
  }

  return {
    status: MEMBER_STATES.LOGGED_IN_NON_MEMBER,
    membership: null,
    isActive: false,
    isExpired: false,
  };
}

export async function detectByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return {
      status: MEMBER_STATES.GUEST_UNKNOWN,
      membership: null,
      isActive: false,
      isExpired: false,
    };
  }

  const record = await findMembershipByEmail(normalized);
  if (!record) {
    return {
      status: MEMBER_STATES.GUEST_EMAIL_NON_MEMBER,
      membership: null,
      isActive: false,
      isExpired: false,
    };
  }

  if (record.active) {
    return {
      status: MEMBER_STATES.GUEST_EMAIL_ACTIVE_MEMBER,
      membership: record,
      isActive: true,
      isExpired: false,
      requiresLogin: true,
    };
  }

  return {
    status: MEMBER_STATES.GUEST_EMAIL_EXPIRED_MEMBER,
    membership: record,
    isActive: false,
    isExpired: true,
  };
}

export async function getMembershipStatus({ userId, email }) {
  if (userId) {
    return detectByUserId(userId);
  }
  if (email) {
    return detectByEmail(email);
  }
  return {
    status: MEMBER_STATES.GUEST_UNKNOWN,
    membership: null,
    isActive: false,
    isExpired: false,
  };
}

export async function detectMemberStatus({ userId, email, isLoggedIn }) {
  if (isLoggedIn && userId) {
    return detectByUserId(userId);
  }
  if (email) {
    return detectByEmail(email);
  }
  return {
    status: MEMBER_STATES.GUEST_UNKNOWN,
    membership: null,
    isActive: false,
    isExpired: false,
  };
}
