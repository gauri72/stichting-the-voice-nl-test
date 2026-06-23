export const MASK_SENTINEL = "••••••••";

export const SMART_API_PERMISSIONS = {
  superadmin: ["*"],
  admin: ["api_builder.read", "api_builder.write", "api_builder.test", "api_builder.activate_test"],
  event_manager: ["api_builder.read", "api_builder.test"],
  finance: ["api_builder.read"],
  viewer: ["api_builder.read"],
};

export function hasSmartApiPermission(role, permission) {
  const perms = SMART_API_PERMISSIONS[role] || SMART_API_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canActivateLive(role) {
  return role === "superadmin";
}

export const CATEGORY_LABELS = {
  payment_gateway: "Payment Gateway",
  logistics: "Logistics",
  banking: "Banking",
  accounting: "Accounting",
  crm: "CRM",
  email_provider: "Email Provider",
  ticketing: "Ticketing",
  government: "Government / Verification",
  custom: "Custom",
};

export const AUTH_LABELS = {
  none: "No Auth",
  api_key: "API Key",
  bearer: "Bearer Token",
  basic: "Basic Auth",
  oauth2: "OAuth 2.0",
  custom: "Custom Headers",
};

export const TRIGGER_LABELS = {
  ticket_booking_created: "Ticket booking created",
  payment_completed: "Payment completed",
  membership_created: "Membership created",
  donation_received: "Donation received",
  sponsorship_received: "Sponsorship received",
  invoice_created: "Invoice created",
  session_booked: "Session booked",
  rsvp_submitted: "RSVP submitted",
  order_refunded: "Order refunded",
  email_sent: "Email sent",
  manual_admin: "Manual admin trigger",
  scheduled_sync: "Scheduled sync",
};

export const BUILDER_STEPS = [
  { id: 1, label: "Connection" },
  { id: 2, label: "Authentication" },
  { id: 3, label: "Endpoints" },
  { id: 4, label: "Test API" },
  { id: 5, label: "Field Mapping" },
  { id: 6, label: "Activation" },
];

export function emptyIntegration() {
  return {
    name: "",
    category: "custom",
    description: "",
    baseUrl: "",
    environment: "test",
    status: "draft",
    connectionType: "rest",
    authType: "none",
    templateId: "",
    triggers: [],
    oauthConfig: { tokenUrl: "", clientId: "", scope: "" },
    credentials: [],
    endpoints: [{ name: "Default endpoint", method: "GET", path: "/", headers: {}, queryParams: {}, bodyTemplate: "" }],
    fieldMappings: [],
    webhookSecret: "",
  };
}

export function credentialFieldsForAuth(authType) {
  switch (authType) {
    case "api_key":
      return [{ key: "apiKey", label: "API Key" }];
    case "bearer":
      return [{ key: "bearerToken", label: "Bearer Token" }];
    case "basic":
      return [
        { key: "username", label: "Username" },
        { key: "password", label: "Password" },
      ];
    case "oauth2":
      return [
        { key: "clientId", label: "Client ID" },
        { key: "clientSecret", label: "Client Secret" },
      ];
    case "custom":
      return [
        { key: "customHeaderName", label: "Header Name" },
        { key: "customHeaderValue", label: "Header Value" },
      ];
    default:
      return [];
  }
}
