export const AUDIENCE_SEGMENTS = [
  { key: "all_members", label: "All Members", description: "Verified users on cluster17" },
  { key: "active_members", label: "Active Members", description: "Users with active memberships" },
  { key: "premium_members", label: "Premium Members", description: "Premium plan holders" },
  { key: "event_attendees", label: "Event Attendees", description: "Past event ticket buyers" },
  { key: "all_users", label: "All Users", description: "Every registered account" },
];

export const WIZARD_STEPS = [
  { key: "compose", label: "Compose Email", hint: "Design your email content" },
  { key: "audience", label: "Select Audience", hint: "Choose who will receive this email" },
  { key: "review", label: "Review & Send", hint: "Preview and send your email" },
];

export const QUICK_ACTIONS = [
  { key: "new", label: "New Broadcast" },
  { key: "audience", label: "Manage Audience" },
  { key: "templates", label: "Email Templates" },
  { key: "reports", label: "Campaign Reports" },
];

export function formatNumber(value) {
  return new Intl.NumberFormat("en-NL").format(Number(value) || 0);
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function segmentLabel(key) {
  return AUDIENCE_SEGMENTS.find((segment) => segment.key === key)?.label || key;
}

export function statusLabel(status) {
  if (status === "sent") return "Sent";
  if (status === "sending") return "Sending";
  if (status === "failed") return "Failed";
  return "Draft";
}
