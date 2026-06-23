export const CUSTOMER_DASHBOARD_PERMISSIONS = {
  superadmin: ["*"],
  admin: ["customer_dashboard.read", "customer_dashboard.write", "customer_dashboard.publish"],
  event_manager: ["customer_dashboard.read"],
  finance: ["customer_dashboard.read"],
  viewer: ["customer_dashboard.read"],
};

export const SECTION_TYPE_LABELS = {
  welcome_banner: "Welcome Banner",
  membership_status: "Membership Status Card",
  membership_benefits: "Membership Benefits Card",
  digital_membership_card: "Digital Membership Card",
  my_events: "My Events",
  my_tickets: "My Tickets",
  upcoming_events: "Upcoming Events",
  featured_events: "Featured Events",
  available_discounts: "Available Discounts",
  referral_code: "Referral Code Widget",
  donations_cta: "Donations CTA",
  sponsorship_cta: "Sponsorship CTA",
  volunteer_cta: "Volunteer CTA",
  profile_details: "Profile Details Widget",
  payment_methods: "Payment Methods Widget",
  recent_activity: "Recent Activity",
  announcements: "Announcements",
  support_contact: "Support / Contact Widget",
  custom_rich_text: "Custom Rich Text Block",
  custom_cta_banner: "Custom CTA Banner",
  stat_cards: "Overview Stat Cards",
  impact_section: "Impact Section",
  closing_cta: "Closing CTA",
  quick_actions: "Quick Actions",
};

export const VISIBILITY_RULE_LABELS = {
  all_users: "All logged-in users",
  active_members: "Active members only",
  expired_members: "Expired members only",
  non_members: "Non-members only",
  premium_members: "Premium members only",
  privileged_members: "Privileged members only",
  student_members: "Student members only",
  users_with_tickets: "Users with tickets",
  users_without_tickets: "Users without tickets",
  incomplete_profile: "Incomplete profile",
};

export const CTA_STYLES = ["primary", "secondary", "outline", "gradient", "ghost", "teal"];

export function hasCustomerDashboardPermission(role, permission) {
  const perms = CUSTOMER_DASHBOARD_PERMISSIONS[role] || CUSTOMER_DASHBOARD_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canWriteCustomerDashboard(role) {
  return hasCustomerDashboardPermission(role, "customer_dashboard.write");
}

export function canPublishCustomerDashboard(role) {
  return hasCustomerDashboardPermission(role, "customer_dashboard.publish");
}

export function formatSectionType(type) {
  return SECTION_TYPE_LABELS[type] || type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || type;
}

export function formatVisibilityRule(rule) {
  return VISIBILITY_RULE_LABELS[rule] || rule;
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
