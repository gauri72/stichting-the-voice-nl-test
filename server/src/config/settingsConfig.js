export const SETTINGS_CATEGORIES = [
  "general",
  "payment",
  "stripe",
  "bank",
  "email_provider",
  "ticketing",
  "membership",
  "sponsorship",
  "donation",
  "invoice",
  "security",
  "integrations",
  "pdf_templates",
];

export const FINANCE_CATEGORIES = new Set(["payment", "stripe", "bank", "invoice"]);
export const CONTENT_CATEGORIES = new Set(["email_provider", "content_overrides"]);

export const SETTINGS_PERMISSIONS = {
  superadmin: ["*"],
  finance: [
    "settings.read",
    "settings.write",
    "settings.finance.read",
    "settings.finance.write",
    "settings.email.read",
    "settings.templates.read",
  ],
  admin: [
    "settings.read",
    "settings.write",
    "settings.content.read",
    "settings.content.write",
    "settings.email.read",
    "settings.templates.read",
    "settings.templates.write",
  ],
  event_manager: [
    "settings.read",
    "settings.content.read",
    "settings.content.write",
    "settings.email.read",
    "settings.templates.read",
    "settings.templates.write",
  ],
  viewer: ["settings.read"],
};

export const SECRET_KEYS = {
  stripe: ["secretKey", "webhookSecret"],
  email_provider: ["smtpPassword", "apiKey"],
  integrations: ["ticketTailorApiKey", "googleAnalyticsId"],
};

export const EMAIL_TEMPLATE_TYPES = [
  "membership_confirmation",
  "membership_renewal",
  "membership_expired_reminder",
  "membership_card_email",
  "membership_payment_receipt",
  "ticket_confirmation",
  "ticket_reminder",
  "ticket_resend",
  "free_booking_confirmation",
  "ticket_refund",
  "sponsorship_confirmation",
  "sponsorship_invoice",
  "sponsorship_payment_reminder",
  "sponsorship_receipt",
  "sponsorship_thank_you",
  "donation_confirmation",
  "donation_receipt",
  "donation_thank_you",
  "recurring_donation_reminder",
  "failed_donation_payment",
  "invoice_created",
  "invoice_reminder",
  "invoice_overdue",
  "invoice_paid_receipt",
  "personal_discount_code",
  "referral_code_created",
  "discount_expiring_soon",
];

export const EMAIL_TEMPLATE_VARIABLES = [
  "first_name",
  "full_name",
  "email",
  "event_name",
  "event_date",
  "event_time",
  "venue_name",
  "ticket_type",
  "ticket_id",
  "qr_code",
  "download_ticket_url",
  "membership_type",
  "membership_id",
  "member_until",
  "download_membership_card_url",
  "amount",
  "currency",
  "receipt_number",
  "invoice_number",
  "payment_due_date",
  "organization_name",
  "website_url",
  "support_email",
];

export const PDF_TEMPLATE_TYPES = [
  "ticket_pdf",
  "membership_card_pdf",
  "sponsorship_receipt_pdf",
  "donation_receipt_pdf",
  "invoice_pdf",
  "audit_report_pdf",
  "budget_sheet_pdf",
];

export function hasSettingsPermission(role, permission) {
  const perms = SETTINGS_PERMISSIONS[role] || SETTINGS_PERMISSIONS.viewer;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canReadCategory(role, category) {
  if (hasSettingsPermission(role, "*") || hasSettingsPermission(role, "settings.write")) return true;
  if (FINANCE_CATEGORIES.has(category)) {
    return hasSettingsPermission(role, "settings.finance.read");
  }
  if (CONTENT_CATEGORIES.has(category) || category === "pdf_templates") {
    return hasSettingsPermission(role, "settings.content.read") || hasSettingsPermission(role, "settings.templates.read");
  }
  return hasSettingsPermission(role, "settings.read");
}

export function canWriteCategory(role, category) {
  if (hasSettingsPermission(role, "*")) return true;
  if (FINANCE_CATEGORIES.has(category)) {
    return hasSettingsPermission(role, "settings.finance.write");
  }
  if (CONTENT_CATEGORIES.has(category) || category === "pdf_templates") {
    return hasSettingsPermission(role, "settings.content.write") || hasSettingsPermission(role, "settings.templates.write");
  }
  return hasSettingsPermission(role, "settings.write");
}

export const DEFAULT_GENERAL = {
  foundationName: "Stichting The V.O.I.C.E. NL",
  brandName: "The V.O.I.C.E. NL",
  websiteUrl: "https://stichtingthevoice.nl",
  supportEmail: "info@stichtingthevoice.nl",
  contactEmail: "info@stichtingthevoice.nl",
  financeEmail: "finance@stichtingthevoice.nl",
  defaultCurrency: "EUR",
  timezone: "Europe/Amsterdam",
  defaultLanguage: "nl",
  logoUrl: "",
  footerCopyright: "© Stichting The V.O.I.C.E. NL. All rights reserved.",
  termsUrl: "/terms-and-conditions",
  privacyUrl: "/privacy-policy",
};

export const DEFAULT_PAYMENT = {
  onlinePaymentsEnabled: true,
  defaultProvider: "stripe",
  mode: "test",
  currency: "EUR",
  bookingFeeEnabled: false,
  bookingFeeAmount: 0,
  bookingFeePercent: 0,
  vatEnabled: true,
  vatPercent: 21,
  freeOrderAutoComplete: true,
  successRedirectUrl: "/dashboard",
  failedRedirectUrl: "/donate",
};

export const DEFAULT_STRIPE = {
  mode: "test",
  publishableKey: "",
  secretKeySet: false,
  webhookSecretSet: false,
  accountId: "",
  connectedAccountId: "",
  cardPaymentsEnabled: true,
  idealEnabled: true,
  bancontactEnabled: false,
  sepaEnabled: false,
  applePayEnabled: true,
  googlePayEnabled: true,
  lastTestAt: null,
  lastTestStatus: "unknown",
  webhookVerified: false,
};

export const DEFAULT_BANK = {
  accountHolderName: "Stichting The V.O.I.C.E. NL",
  iban: "",
  bic: "",
  bankName: "",
  paymentReferenceFormat: "INV-{invoice_number}",
  manualPaymentInstructions: "",
  lastStripeSyncAt: null,
  lastStripeSyncStatus: "not_synced",
};

export const DEFAULT_EMAIL_PROVIDER = {
  provider: "smtp",
  senderName: "Stichting The V.O.I.C.E. NL",
  senderEmail: "",
  replyToEmail: "",
  supportEmail: "",
  financeEmail: "",
  testEmailAddress: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPasswordSet: false,
  apiKeySet: false,
  lastTestAt: null,
  lastTestStatus: "unknown",
};
