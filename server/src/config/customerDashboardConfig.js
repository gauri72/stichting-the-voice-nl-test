export const CUSTOMER_SECTION_TYPES = [
  "welcome_banner",
  "membership_status",
  "membership_benefits",
  "digital_membership_card",
  "my_events",
  "my_tickets",
  "my_sessions",
  "upcoming_events",
  "featured_events",
  "available_discounts",
  "referral_code",
  "donations_cta",
  "sponsorship_cta",
  "volunteer_cta",
  "profile_details",
  "payment_methods",
  "recent_activity",
  "announcements",
  "support_contact",
  "custom_rich_text",
  "custom_cta_banner",
  "stat_cards",
  "impact_section",
  "closing_cta",
  "quick_actions",
];

export const VISIBILITY_RULES = [
  "all_users",
  "active_members",
  "expired_members",
  "non_members",
  "premium_members",
  "privileged_members",
  "student_members",
  "users_with_tickets",
  "users_without_tickets",
  "incomplete_profile",
];

export const CTA_STYLES = ["primary", "secondary", "outline", "gradient", "ghost", "teal"];

export const CUSTOMER_DASHBOARD_PERMISSIONS = {
  superadmin: ["*"],
  admin: ["customer_dashboard.read", "customer_dashboard.write", "customer_dashboard.publish"],
  event_manager: ["customer_dashboard.read"],
  finance: ["customer_dashboard.read"],
  viewer: ["customer_dashboard.read"],
};

export const CUSTOMER_DASHBOARD_AUDIT = {
  SECTION_CREATED: "customer_dashboard_section_created",
  SECTION_UPDATED: "customer_dashboard_section_updated",
  SECTION_REORDERED: "customer_dashboard_section_reordered",
  SECTION_HIDDEN: "customer_dashboard_section_hidden",
  PUBLISHED: "customer_dashboard_published",
  VERSION_RESTORED: "customer_dashboard_version_restored",
  CTA_CHANGED: "customer_dashboard_cta_changed",
  VISIBILITY_CHANGED: "customer_dashboard_visibility_changed",
};

export function hasCustomerDashboardPermission(role, permission) {
  const perms = CUSTOMER_DASHBOARD_PERMISSIONS[role] || CUSTOMER_DASHBOARD_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export const SECTION_TYPE_LABELS = Object.fromEntries(
  CUSTOMER_SECTION_TYPES.map((t) => [t, t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())])
);
