/** Central RBAC permission registry for V.O.I.C.E. NL admin panel. */

export const PERMISSION_MODULES = {
  dashboard: ["view"],
  events: ["view", "create", "edit", "delete", "publish"],
  tickets: ["view", "edit", "resend", "refund", "export"],
  checkin: ["view", "scan"],
  memberships: ["view", "create", "edit", "delete", "export"],
  users: ["view", "edit", "export"],
  templates: ["view", "edit", "upload"],
  discounts: ["view", "edit", "delete"],
  vouchers: ["view", "edit", "delete"],
  vip_passes: ["view", "edit"],
  sponsorships: ["view", "edit", "receipt", "export"],
  donations: ["view", "edit", "receipt", "export"],
  finance: ["view", "edit", "export"],
  reports: ["view", "create", "export"],
  cms: ["view", "edit", "publish"],
  settings: ["view", "edit", "financial"],
  api_builder: ["view", "edit", "secrets", "test"],
  access_management: ["view", "edit"],
  sessions: ["view", "edit", "delete"],
  rsvp: ["view", "edit"],
  seat_maps: ["view", "edit"],
  inventory: ["view", "edit"],
  documents: ["view", "edit", "export"],
  communication: ["view", "edit", "send"],
  reviews: ["view", "edit", "moderate"],
  team_public: ["view", "edit"],
  checkout_forms: ["view", "edit"],
  personal_ai: ["view", "edit"],
  wallet: ["view", "edit"],
  icon_library: ["view"],
};

export function buildPermissionList() {
  const list = [];
  for (const [module, actions] of Object.entries(PERMISSION_MODULES)) {
    for (const action of actions) {
      list.push({
        key: `${module}.${action}`,
        module,
        action,
        label: `${module.replace(/_/g, " ")} — ${action}`,
      });
    }
  }
  return list;
}

export const ALL_PERMISSIONS = buildPermissionList().map((p) => p.key);

function perms(modules) {
  const out = [];
  for (const [module, actions] of Object.entries(modules)) {
    for (const action of actions) out.push(`${module}.${action}`);
  }
  return out;
}

export const DEFAULT_ROLES = [
  {
    slug: "super_admin",
    legacyRole: "superadmin",
    name: "Super Admin",
    description: "Full access to everything.",
    isSystem: true,
    permissions: ["*"],
    dashboardAccess: "full",
  },
  {
    slug: "admin",
    legacyRole: "admin",
    name: "Admin",
    description: "Access to most operational modules except critical settings.",
    isSystem: true,
    permissions: perms({
      dashboard: ["view"],
      events: ["view", "create", "edit", "delete", "publish"],
      tickets: ["view", "edit", "resend", "refund", "export"],
      checkin: ["view", "scan"],
      memberships: ["view", "create", "edit", "delete", "export"],
      users: ["view", "edit", "export"],
      templates: ["view", "edit", "upload"],
      discounts: ["view", "edit", "delete"],
      vouchers: ["view", "edit", "delete"],
      vip_passes: ["view", "edit"],
      sponsorships: ["view", "edit", "receipt", "export"],
      donations: ["view", "edit", "receipt", "export"],
      finance: ["view", "export"],
      reports: ["view", "create", "export"],
      cms: ["view", "edit", "publish"],
      settings: ["view"],
      api_builder: ["view", "edit", "test"],
      sessions: ["view", "edit", "delete"],
      rsvp: ["view", "edit"],
      seat_maps: ["view", "edit"],
      inventory: ["view", "edit"],
      documents: ["view", "edit"],
      communication: ["view", "edit", "send"],
      team_public: ["view", "edit"],
      checkout_forms: ["view", "edit"],
      personal_ai: ["view", "edit"],
      wallet: ["view", "edit"],
      icon_library: ["view"],
    }),
    dashboardAccess: "operational",
  },
  {
    slug: "event_manager",
    legacyRole: "event_manager",
    name: "Event Manager",
    description: "Events, tickets, check-in, inventory, documents.",
    isSystem: true,
    permissions: perms({
      dashboard: ["view"],
      events: ["view", "create", "edit", "publish"],
      tickets: ["view", "edit", "resend", "export"],
      checkin: ["view", "scan"],
      vip_passes: ["view", "edit"],
      seat_maps: ["view", "edit"],
      inventory: ["view", "edit"],
      documents: ["view", "edit", "export"],
      sessions: ["view", "edit"],
      rsvp: ["view", "edit"],
      reviews: ["view", "moderate"],
    }),
    dashboardAccess: "events",
  },
  {
    slug: "finance_manager",
    legacyRole: "finance",
    name: "Finance Manager",
    description: "Payments, invoices, donations, sponsorships, reports.",
    isSystem: true,
    permissions: perms({
      dashboard: ["view"],
      donations: ["view", "edit", "receipt", "export"],
      sponsorships: ["view", "edit", "receipt", "export"],
      finance: ["view", "edit", "export"],
      documents: ["view", "edit", "export"],
      inventory: ["view"],
      reports: ["view", "create", "export"],
      tickets: ["view", "export"],
    }),
    dashboardAccess: "finance",
  },
  {
    slug: "membership_manager",
    legacyRole: null,
    name: "Membership Manager",
    description: "Memberships, users, discounts, member dashboard.",
    isSystem: true,
    permissions: perms({
      dashboard: ["view"],
      memberships: ["view", "create", "edit", "delete", "export"],
      users: ["view", "edit", "export"],
      discounts: ["view", "edit", "delete"],
      vouchers: ["view", "edit"],
    }),
    dashboardAccess: "memberships",
  },
  {
    slug: "content_manager",
    legacyRole: null,
    name: "Content Manager",
    description: "Website CMS, pages, media, reviews, highlights.",
    isSystem: true,
    permissions: perms({
      dashboard: ["view"],
      cms: ["view", "edit", "publish"],
      documents: ["view", "edit"],
      reviews: ["view", "edit", "moderate"],
      team_public: ["view", "edit"],
    }),
    dashboardAccess: "content",
  },
  {
    slug: "volunteer_staff",
    legacyRole: null,
    name: "Volunteer / Staff",
    description: "Check-in and assigned event operations only.",
    isSystem: true,
    permissions: perms({
      checkin: ["view", "scan"],
      tickets: ["view"],
      events: ["view"],
    }),
    dashboardAccess: "checkin",
  },
  {
    slug: "viewer",
    legacyRole: "viewer",
    name: "Viewer",
    description: "Read-only access.",
    isSystem: true,
    permissions: perms({
      dashboard: ["view"],
      events: ["view"],
      tickets: ["view"],
      memberships: ["view"],
      users: ["view"],
      donations: ["view"],
      sponsorships: ["view"],
      finance: ["view"],
      reports: ["view"],
      cms: ["view"],
      inventory: ["view"],
      documents: ["view"],
      personal_ai: ["view"],
      wallet: ["view"],
      icon_library: ["view"],
    }),
    dashboardAccess: "readonly",
  },
];

export const ACCESS_AUDIT_ACTIONS = {
  USER_INVITED: "access.user.invited",
  USER_UPDATED: "access.user.updated",
  USER_SUSPENDED: "access.user.suspended",
  USER_DISABLED: "access.user.disabled",
  USER_REACTIVATED: "access.user.reactivated",
  USER_DELETED: "access.user.deleted",
  ROLE_ASSIGNED: "access.role.assigned",
  ROLE_CREATED: "access.role.created",
  ROLE_UPDATED: "access.role.updated",
  ROLE_DELETED: "access.role.deleted",
  PERMISSION_CHANGED: "access.permission.changed",
  LOGIN_SUCCESS: "access.login.success",
  LOGIN_FAILED: "access.login.failed",
  LOGOUT: "access.logout",
  INVITE_RESENT: "access.invite.resent",
  INVITE_ACCEPTED: "access.invite.accepted",
  SETTINGS_CHANGED: "access.settings.changed",
};

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
  "/admin/api-builder": "api_builder.view",
  "/admin/team-members": "team_public.view",
  "/admin/settings": "settings.view",
  "/admin/reports": "reports.view",
  "/admin/access-management": "access_management.view",
  "/admin/inventory": "inventory.view",
  "/admin/documents": "documents.view",
  "/admin/personal-ai": "personal_ai.view",
  "/admin/wallet": "wallet.view",
  "/admin/icon-library": "icon_library.view",
};

export const DEFAULT_INVITE_EXPIRY_DAYS = 7;

export function hasPermission(permissions, required) {
  if (!required) return true;
  if (!permissions?.length) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(required)) return true;
  const [module] = required.split(".");
  if (permissions.includes(`${module}.*`)) return true;
  return false;
}

export function hasAnyPermission(permissions, requiredList = []) {
  return requiredList.some((p) => hasPermission(permissions, p));
}

export function canAccessEvent(admin, eventId) {
  if (!admin) return false;
  if (hasPermission(admin.permissions, "*")) return true;
  if (!admin.assignedEvents?.length) return hasPermission(admin.permissions, "events.view");
  return admin.assignedEvents.map(String).includes(String(eventId));
}
