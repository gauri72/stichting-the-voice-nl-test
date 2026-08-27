export const NAV_ROUTE_PERMISSIONS = {
  "/admin/dashboard": "dashboard.view",
  "/admin/dashboard-builder": "dashboard.view",
  "/admin/customer-dashboard-builder": "cms.view",
  "/admin/events": "events.view",
  "/admin/sessions": "sessions.view",
  "/admin/session-calendar": "sessions.view",
  "/admin/session-bookings": "sessions.view",
  "/admin/resources": "sessions.view",
  "/admin/rsvps": "rsvp.view",
  "/admin/checkout-forms": "checkout_forms.view",
  "/admin/reviews": "reviews.view",
  "/admin/tickets": "tickets.view",
  "/admin/check-in": "checkin.view",
  "/admin/memberships": "memberships.view",
  "/admin/users": "users.view",
  "/admin/templates": "templates.view",
  "/admin/discounts": "discounts.view",
  "/admin/sponsorships": "sponsorships.view",
  "/admin/donations": "donations.view",
  "/admin/finance/invoices": "finance.view",
  "/admin/finance/event-budgets": "finance.view",
  "/admin/finance/transactions": "finance.view",
  "/admin/finance/audit-reports": "finance.view",
  "/admin/finance/reports": "finance.view",
  "/admin/finance/settings": "settings.financial",
  "/admin/vouchers": "vouchers.view",
  "/admin/vip-passes": "vip_passes.view",
  "/admin/communication": "communication.view",
  "/admin/pages": "cms.view",
  "/admin/cms": "cms.view",
  "/admin/cms/team-members": "team_public.view",
  "/admin/api-builder": "api_builder.view",
  "/admin/team-members": "team_public.view",
  "/admin/members": "memberships.view",
  "/admin/settings": "settings.view",
  "/admin/reports": "reports.view",
  "/admin/access-management": "access_management.view",
  "/admin/inventory": "inventory.view",
  "/admin/documents": "documents.view",
  "/admin/personal-ai": "personal_ai.view",
  "/admin/wallet": "wallet.view",
  "/admin/icon-library": "icon_library.view",
};

export function hasPermission(permissions, required) {
  if (!required) return true;
  if (!permissions?.length) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(required)) return true;
  const [module] = required.split(".");
  if (permissions.includes(`${module}.*`)) return true;
  return false;
}

export function hasAnyPermission(permissions, list = []) {
  return list.some((p) => hasPermission(permissions, p));
}

export function canAccessRoute(permissions, path) {
  // Match the longest registered prefix so nested/dynamic sub-routes (e.g.
  // /admin/events/:id/operations) inherit their parent section's permission
  // instead of silently falling through as "allowed" just because the exact
  // path was never registered.
  let bestMatch = "";
  let required = null;
  let matched = false;
  for (const [registeredPath, permission] of Object.entries(NAV_ROUTE_PERMISSIONS)) {
    if (
      (path === registeredPath || path.startsWith(`${registeredPath}/`)) &&
      registeredPath.length > bestMatch.length
    ) {
      bestMatch = registeredPath;
      required = permission;
      matched = true;
    }
  }
  if (!matched) {
    // Fail closed: an admin route with no registered permission mapping
    // requires superadmin rather than letting any admin through.
    return Boolean(permissions?.includes("*"));
  }
  return hasPermission(permissions, required);
}

export function canAccessEvent(admin, eventId) {
  if (!admin) return false;
  if (hasPermission(admin.permissions, "*")) return true;
  if (!admin.assignedEvents?.length) return hasPermission(admin.permissions, "events.view");
  return admin.assignedEvents.map(String).includes(String(eventId));
}

export const STATUS_LABELS = {
  invited: "Invited",
  active: "Active",
  suspended: "Suspended",
  disabled: "Disabled",
};
