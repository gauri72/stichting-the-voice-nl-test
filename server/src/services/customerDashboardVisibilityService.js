/**
 * Evaluates whether a dashboard section should be visible for a user context.
 */
export function buildUserVisibilityContext({ user, dashboardPayload, membershipPayload, ticketCount = 0 }) {
  const active = membershipPayload?.active;
  const hasMembership = Boolean(membershipPayload?.hasMembership && active);
  const status = String(active?.status || membershipPayload?.membershipStatus || "").toLowerCase();
  const isExpired = hasMembership && (status.includes("expired") || status.includes("inactive"));
  const isActiveMember = hasMembership && !isExpired;
  const planId = String(active?.planId || "").toLowerCase();

  const profile = dashboardPayload?.profile || {};
  const profileFields = [profile.firstName, profile.lastName, profile.email, profile.phone];
  const profileComplete = profileFields.every((f) => String(f || "").trim().length > 0);

  return {
    isLoggedIn: Boolean(user?.id),
    hasMembership,
    isActiveMember,
    isExpiredMember: isExpired,
    isNonMember: !hasMembership,
    isPremiumMember: isActiveMember && (planId.includes("family") || planId.includes("single") || planId.includes("premium")),
    isPrivilegedMember: isActiveMember && planId.includes("privileged"),
    isStudentMember: isActiveMember && planId.includes("student"),
    hasTickets: ticketCount > 0,
    hasNoTickets: ticketCount === 0,
    incompleteProfile: !profileComplete,
  };
}

const RULE_MAP = {
  all_users: () => true,
  active_members: (ctx) => ctx.isActiveMember,
  expired_members: (ctx) => ctx.isExpiredMember,
  non_members: (ctx) => ctx.isNonMember,
  premium_members: (ctx) => ctx.isPremiumMember,
  privileged_members: (ctx) => ctx.isPrivilegedMember,
  student_members: (ctx) => ctx.isStudentMember,
  users_with_tickets: (ctx) => ctx.hasTickets,
  users_without_tickets: (ctx) => ctx.hasNoTickets,
  incomplete_profile: (ctx) => ctx.incompleteProfile,
};

export function sectionVisibleForUser(section, context) {
  if (section.isVisible === false) return false;
  const rules = section.visibilityRules?.rules || [];
  if (!rules.length) return true;
  return rules.some((rule) => {
    const fn = RULE_MAP[rule];
    return fn ? fn(context) : false;
  });
}

export function filterSectionsForUser(sections, context) {
  return sections.filter((section) => sectionVisibleForUser(section, context));
}
