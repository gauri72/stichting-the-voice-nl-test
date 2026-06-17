export function planTierLabel(planId) {
  if (!planId) return "Member";
  if (String(planId).startsWith("privileged")) return "Privileged";
  return "Premium";
}
