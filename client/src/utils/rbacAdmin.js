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
  "/admin/communication": "communication.view",
  "/admin/pages": "cms.view",
  "/admin/api-builder": "api_builder.view",
  "/admin/team-members": "team_public.view",
  "/admin/settings": "settings.view",
  "/admin/reports": "reports.view",
  "/admin/access-management": "access_management.view",
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
  const required = NAV_ROUTE_PERMISSIONS[path];
  if (!required) return true;
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
