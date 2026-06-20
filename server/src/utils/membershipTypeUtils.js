import { resolvePlanId } from "../config/membershipPlans.js";
import { inferPlanIdFromTitle } from "../services/membershipService.js";

/**
 * Normalize TicketTailor / local membership type names to plan IDs and labels.
 */
export function normalizeMembershipType(rawType) {
  const t = String(rawType || "").trim().toLowerCase();

  if (!t) {
    return { planId: "", label: "", normalizedKey: "" };
  }

  if (t.includes("student")) {
    return { planId: "student", label: "Student", normalizedKey: "student" };
  }
  if (t.includes("privileged") && t.includes("family")) {
    return { planId: "privilegedFamily", label: "Privileged Family", normalizedKey: "privilegedFamily" };
  }
  if (t.includes("privileged") && t.includes("single")) {
    return { planId: "privilegedSingle", label: "Privileged Single", normalizedKey: "privilegedSingle" };
  }
  if (t.includes("privileged")) {
    return { planId: "privilegedFamily", label: "Privileged Family", normalizedKey: "privilegedFamily" };
  }
  if (t.includes("premium") && t.includes("family")) {
    return { planId: "premiumFamily", label: "Premium Family", normalizedKey: "premiumFamily" };
  }
  if (t.includes("premium") && t.includes("single")) {
    return { planId: "premiumSingle", label: "Premium Single", normalizedKey: "premiumSingle" };
  }
  if (t.includes("premium members") || t === "premium") {
    return { planId: "premiumSingle", label: "Premium", normalizedKey: "premiumSingle" };
  }
  if (t.includes("member pass")) {
    return { planId: "custom", label: "Member Pass", normalizedKey: "custom" };
  }
  if (t.includes("membership") || t.includes("member")) {
    const inferred = resolvePlanId(inferPlanIdFromTitle(rawType));
    return {
      planId: inferred,
      label: String(rawType).trim(),
      normalizedKey: inferred,
    };
  }

  const inferred = resolvePlanId(inferPlanIdFromTitle(rawType));
  return {
    planId: inferred,
    label: String(rawType).trim(),
    normalizedKey: inferred,
  };
}

export function resolveMembershipPlanId({ planId, membershipType }) {
  const fromPlan = resolvePlanId(planId || "");
  if (fromPlan && fromPlan !== "custom") return fromPlan;
  const normalized = normalizeMembershipType(membershipType);
  return normalized.planId || fromPlan || "";
}
