import crypto from "crypto";
import AppSetting from "../models/AppSetting.js";
import SettingsAuditLog from "../models/SettingsAuditLog.js";
import {
  DEFAULT_GENERAL,
  DEFAULT_PAYMENT,
  DEFAULT_STRIPE,
  DEFAULT_BANK,
  DEFAULT_EMAIL_PROVIDER,
  SECRET_KEYS,
} from "../config/settingsConfig.js";
import { encryptSecret, decryptSecret, maskSecret, isEncryptedValue } from "../utils/secretEncryption.js";
import { getNextSequence } from "../utils/sequence.js";
import env from "../config/env.js";

const CATEGORY_DEFAULTS = {
  general: DEFAULT_GENERAL,
  payment: DEFAULT_PAYMENT,
  stripe: DEFAULT_STRIPE,
  bank: DEFAULT_BANK,
  email_provider: DEFAULT_EMAIL_PROVIDER,
  ticketing: {
    qrVerificationUrl: "",
    freeBookingAutoComplete: true,
    allowTicketResend: true,
    allowTicketPdfDownload: true,
    allowQrDownload: true,
    defaultTicketTerms: "",
    checkInEnabled: true,
    defaultSeatHoldMinutes: 10,
    enableReservedSeating: true,
    allowSeatChangesAfterBooking: true,
    requireSeatSelectionBeforeCheckout: true,
    defaultSeatMapZoom: 1,
    seatMapImageMaxSizeMb: 5,
  },
  membership: {
    expiryReminderDays: 30,
    membershipCodeFormat: "VNL-{year}-{seq}",
    qrVerificationUrl: "",
    ticketTailorLookupEnabled: true,
    membershipDiscountsEnabled: true,
    autoLinkExternalMemberships: true,
  },
  sponsorship: {
    paymentTermsDays: 30,
    receiptNumberFormat: "SPR-{year}-{seq}",
    defaultFinanceEmail: "",
  },
  donation: {
    receiptNumberFormat: "DON-{year}-{seq}",
    anonymousDonationsEnabled: true,
    recurringDonationsEnabled: true,
  },
  invoice: {
    invoiceNumberFormat: "INV-{year}-{seq}",
    paymentTermsDays: 30,
    defaultVatRate: 21,
    footerText: "",
    reminderScheduleDays: [7, 14],
    overdueScheduleDays: [30, 45],
  },
  security: {
    requireReauthForFinancialChanges: true,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    auditRetentionDays: 365,
  },
  integrations: {
    ticketTailorEnabled: true,
    ticketTailorApiKeySet: false,
    stripeEnabled: true,
    googleAnalyticsId: "",
    googleTagManagerId: "",
    whatsappUrl: "",
    youtubeUrl: "",
    googleMapsApiKeySet: false,
    pwaEnabled: true,
  },
  pdf_templates: {},
};

function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

async function nextAuditId() {
  const seq = await getNextSequence("settings_audit");
  return `SET-AUD-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

function maskValue(key, value, isSecret) {
  if (value === null || value === undefined || value === "") return "";
  if (isSecret || SECRET_KEYS.stripe?.includes(key) || SECRET_KEYS.email_provider?.includes(key)) {
    const plain = isEncryptedValue(value) ? decryptSecret(value) : String(value);
    return maskSecret(plain);
  }
  if (typeof value === "object") return JSON.stringify(value).slice(0, 120);
  return String(value).slice(0, 200);
}

export async function logSettingsChange({ category, key, action, oldValue, newValue, isSecret, adminId, ip }) {
  await SettingsAuditLog.create({
    auditId: await nextAuditId(),
    category,
    key: key || "",
    action,
    oldValueMasked: maskValue(key, oldValue, isSecret),
    newValueMasked: maskValue(key, newValue, isSecret),
    changedBy: adminId,
    ipAddress: ip || "",
  });
}

async function getSettingDoc(category, key) {
  return AppSetting.findOne({ category, key }).lean();
}

export async function get(category, key, { includeSecret = false } = {}) {
  const doc = await getSettingDoc(category, key);
  if (!doc) {
    const defaults = CATEGORY_DEFAULTS[category];
    return defaults?.[key] ?? null;
  }
  if (doc.isSecret && doc.encrypted) {
    if (!includeSecret) return doc.value ? maskSecret(decryptSecret(doc.value)) : "";
    return decryptSecret(doc.value);
  }
  return doc.value;
}

export async function getSecret(category, key) {
  const doc = await getSettingDoc(category, key);
  if (!doc?.value) {
    if (category === "stripe" && key === "secretKey") return env.stripe.secretKey || "";
    if (category === "stripe" && key === "webhookSecret") return env.stripe.webhookSecret || "";
    if (category === "email_provider" && key === "smtpPassword") return env.email.pass || "";
    return "";
  }
  if (doc.encrypted) return decryptSecret(doc.value);
  return doc.value;
}

export async function getCategorySettings(category, { maskSecrets = true } = {}) {
  const defaults = { ...(CATEGORY_DEFAULTS[category] || {}) };
  const docs = await AppSetting.find({ category }).lean();

  for (const doc of docs) {
    if (doc.isSecret && doc.encrypted) {
      if (maskSecrets) {
        defaults[doc.key] = doc.value ? maskSecret(decryptSecret(doc.value)) : "";
        if (doc.key === "secretKey" || doc.key === "smtpPassword" || doc.key === "apiKey" || doc.key === "webhookSecret") {
          defaults[`${doc.key}Set`] = Boolean(doc.value);
        }
      } else {
        defaults[doc.key] = decryptSecret(doc.value);
      }
    } else {
      defaults[doc.key] = doc.value;
    }
  }

  if (category === "stripe") {
    if (!defaults.secretKeySet) defaults.secretKeySet = Boolean(env.stripe.secretKey);
    if (!defaults.webhookSecretSet) defaults.webhookSecretSet = Boolean(env.stripe.webhookSecret);
    if (!defaults.publishableKey && process.env.STRIPE_PUBLISHABLE_KEY) {
      defaults.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    }
    defaults.envConfigured = Boolean(env.stripe.secretKey);
    defaults.mode = defaults.mode || (env.stripe.secretKey?.startsWith("sk_live_") ? "live" : "test");
  }

  if (category === "email_provider") {
    if (!defaults.smtpPasswordSet) defaults.smtpPasswordSet = Boolean(env.email.pass);
    if (!defaults.senderEmail && env.email.from) defaults.senderEmail = env.email.from;
    if (!defaults.smtpHost && env.email.host) defaults.smtpHost = env.email.host;
    defaults.envConfigured = Boolean(env.email.host && env.email.user);
  }

  if (category === "bank") {
    const FinanceSettings = (await import("../models/FinanceSettings.js")).default;
    const finance = await FinanceSettings.findOne({ key: "default" }).lean();
    if (finance) {
      defaults.iban = defaults.iban || finance.iban || "";
      defaults.bic = defaults.bic || finance.bic || "";
      defaults.bankName = defaults.bankName || finance.bankName || "";
      defaults.accountHolderName = defaults.accountHolderName || finance.organizationName || "";
    }
  }

  if (category === "general") {
    defaults.supportEmail = defaults.supportEmail || env.org.contactEmail;
    defaults.websiteUrl = defaults.websiteUrl || env.clientUrl;
  }

  return defaults;
}

export async function updateCategorySettings(category, data, adminId, ip) {
  const secretKeys = SECRET_KEYS[category] || [];
  const results = {};

  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined) continue;
    if (key.endsWith("Set")) continue;

    const isSecret = secretKeys.includes(key) || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password") || key === "apiKey";
    const existing = await getSettingDoc(category, key);
    let storedValue = value;

    if (isSecret) {
      const replacement = String(value || "").trim();
      if (!replacement || replacement.includes("••••")) continue;
      storedValue = encryptSecret(replacement);
    }

    await AppSetting.findOneAndUpdate(
      { category, key },
      {
        $set: {
          settingsId: existing?.settingsId || `SET-${category}-${key}`,
          category,
          key,
          value: storedValue,
          encrypted: isSecret,
          isSecret,
          updatedBy: adminId,
        },
      },
      { upsert: true, new: true }
    );

    await logSettingsChange({
      category,
      key,
      action: "updated",
      oldValue: existing?.value,
      newValue: storedValue,
      isSecret,
      adminId,
      ip,
    });

    results[key] = isSecret ? maskSecret(value) : storedValue;
  }

  if (category === "bank") {
    await syncBankToFinanceSettings(data, adminId);
  }

  return getCategorySettings(category);
}

async function syncBankToFinanceSettings(data, adminId) {
  const FinanceSettings = (await import("../models/FinanceSettings.js")).default;
  const update = {};
  if (data.iban !== undefined) update.iban = data.iban;
  if (data.bic !== undefined) update.bic = data.bic;
  if (data.bankName !== undefined) update.bankName = data.bankName;
  if (data.accountHolderName !== undefined) update.organizationName = data.accountHolderName;
  if (Object.keys(update).length) {
    update.updatedBy = adminId;
    await FinanceSettings.findOneAndUpdate({ key: "default" }, { $set: update }, { upsert: true });
  }
}

export async function getAllSettingsSummary() {
  const summary = {};
  for (const category of Object.keys(CATEGORY_DEFAULTS)) {
    summary[category] = await getCategorySettings(category);
  }
  return summary;
}

export async function listAuditLogs({ limit = 50, category } = {}) {
  const query = category ? { category } : {};
  return SettingsAuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("changedBy", "name email firstName lastName")
    .lean();
}

export function generateTemplateId() {
  return `TPL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
