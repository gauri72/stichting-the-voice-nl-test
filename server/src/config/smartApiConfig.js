export const API_BUILDER_CATEGORIES = [
  "payment_gateway",
  "logistics",
  "banking",
  "accounting",
  "crm",
  "email_provider",
  "ticketing",
  "government",
  "custom",
];

export const API_CONNECTION_TYPES = ["rest", "webhook", "oauth2"];

export const API_AUTH_TYPES = ["none", "api_key", "bearer", "basic", "oauth2", "custom"];

export const API_HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const API_ENVIRONMENTS = ["test", "live"];

export const API_INTEGRATION_STATUSES = ["draft", "active", "inactive"];

export const API_TRIGGERS = [
  "ticket_booking_created",
  "payment_completed",
  "membership_created",
  "donation_received",
  "sponsorship_received",
  "invoice_created",
  "session_booked",
  "rsvp_submitted",
  "order_refunded",
  "email_sent",
  "manual_admin",
  "scheduled_sync",
];

export const SMART_API_AUDIT_ACTIONS = {
  INTEGRATION_CREATED: "smart_api.integration.created",
  INTEGRATION_UPDATED: "smart_api.integration.updated",
  INTEGRATION_DELETED: "smart_api.integration.deleted",
  INTEGRATION_ACTIVATED: "smart_api.integration.activated",
  INTEGRATION_DEACTIVATED: "smart_api.integration.deactivated",
  INTEGRATION_TESTED: "smart_api.integration.tested",
  LOG_RETRIED: "smart_api.log.retried",
  LOG_RESOLVED: "smart_api.log.resolved",
  WEBHOOK_RECEIVED: "smart_api.webhook.received",
};

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

export function canActivateEnvironment(role, environment) {
  if (environment === "live") return role === "superadmin";
  return hasSmartApiPermission(role, "api_builder.activate_test") || role === "superadmin";
}

export const REQUEST_TIMEOUT_MS = 30_000;
export const RATE_LIMIT_PER_MINUTE = 30;

export const INTEGRATION_TEMPLATES = {
  stripe: {
    id: "stripe",
    name: "Stripe",
    category: "payment_gateway",
    connectionType: "rest",
    authType: "bearer",
    baseUrl: "https://api.stripe.com/v1",
    description: "Payment gateway for cards and subscriptions.",
    endpoints: [
      { name: "List charges", method: "GET", path: "/charges", headers: {}, queryParams: { limit: "10" }, bodyTemplate: "" },
    ],
  },
  mollie: {
    id: "mollie",
    name: "Mollie",
    category: "payment_gateway",
    connectionType: "rest",
    authType: "bearer",
    baseUrl: "https://api.mollie.com/v2",
    description: "European payment provider.",
    endpoints: [{ name: "List payments", method: "GET", path: "/payments", headers: {}, queryParams: { limit: "10" }, bodyTemplate: "" }],
  },
  postnl: {
    id: "postnl",
    name: "PostNL",
    category: "logistics",
    connectionType: "rest",
    authType: "api_key",
    baseUrl: "https://api.postnl.nl",
    description: "Shipping and tracking logistics API.",
    endpoints: [{ name: "Track shipment", method: "GET", path: "/shipment/v2/status", headers: {}, queryParams: {}, bodyTemplate: "" }],
  },
  sendgrid: {
    id: "sendgrid",
    name: "SendGrid",
    category: "email_provider",
    connectionType: "rest",
    authType: "bearer",
    baseUrl: "https://api.sendgrid.com/v3",
    description: "Transactional email API.",
    endpoints: [{ name: "Send mail", method: "POST", path: "/mail/send", headers: { "Content-Type": "application/json" }, queryParams: {}, bodyTemplate: "{}" }],
  },
  brevo: {
    id: "brevo",
    name: "Brevo",
    category: "email_provider",
    connectionType: "rest",
    authType: "api_key",
    baseUrl: "https://api.brevo.com/v3",
    description: "Email and marketing automation.",
    endpoints: [{ name: "Account info", method: "GET", path: "/account", headers: {}, queryParams: {}, bodyTemplate: "" }],
  },
  tickettailor: {
    id: "tickettailor",
    name: "TicketTailor",
    category: "ticketing",
    connectionType: "rest",
    authType: "api_key",
    baseUrl: "https://api.tickettailor.com/v1",
    description: "Ticketing platform integration.",
    endpoints: [{ name: "List events", method: "GET", path: "/events", headers: {}, queryParams: {}, bodyTemplate: "" }],
  },
  bank_api: {
    id: "bank_api",
    name: "Bank API",
    category: "banking",
    connectionType: "rest",
    authType: "oauth2",
    baseUrl: "https://api.bank.example.com",
    description: "Generic bank / PSD2 style API template.",
    endpoints: [{ name: "Account balance", method: "GET", path: "/accounts", headers: {}, queryParams: {}, bodyTemplate: "" }],
  },
  generic_rest: {
    id: "generic_rest",
    name: "Generic REST API",
    category: "custom",
    connectionType: "rest",
    authType: "none",
    baseUrl: "https://api.example.com",
    description: "Blank REST integration template.",
    endpoints: [{ name: "Health check", method: "GET", path: "/health", headers: {}, queryParams: {}, bodyTemplate: "" }],
  },
  custom_webhook: {
    id: "custom_webhook",
    name: "Custom Webhook",
    category: "custom",
    connectionType: "webhook",
    authType: "custom",
    baseUrl: "",
    description: "Incoming webhook receiver for third-party callbacks.",
    endpoints: [],
  },
};
