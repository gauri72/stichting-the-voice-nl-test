import * as settingsService from "./settingsService.js";
import { isMailerConfigured, verifySmtpConnection, getSmtpTransporter, getMailFromAddress } from "./smtpTransport.js";
import env from "../config/env.js";

export async function getEmailProviderSettings(masked = true) {
  return settingsService.getCategorySettings("email_provider", { maskSecrets: masked });
}

export async function getEffectiveSmtpConfig() {
  const settings = await settingsService.getCategorySettings("email_provider", { maskSecrets: false });
  const password = await settingsService.getSecret("email_provider", "smtpPassword");
  return {
    host: settings.smtpHost || env.email.host,
    port: settings.smtpPort || env.email.port,
    secure: settings.smtpSecure ?? env.email.secure,
    user: settings.smtpUser || env.email.user,
    pass: password || env.email.pass,
    from: settings.senderEmail || env.email.from,
    senderName: settings.senderName || "Stichting The V.O.I.C.E. NL",
  };
}

export async function testEmailProvider({ to, adminId } = {}) {
  const target = to || (await getEmailProviderSettings()).testEmailAddress;
  if (!target) {
    const error = new Error("Test email address is required.");
    error.status = 400;
    throw error;
  }

  if (!isMailerConfigured()) {
    const error = new Error("Email provider is not configured.");
    error.status = 400;
    throw error;
  }

  await verifySmtpConnection();
  const transport = getSmtpTransporter();
  const from = getMailFromAddress() || `"Stichting The V.O.I.C.E. NL" <noreply@stichtingthevoice.nl>`;

  await transport.sendMail({
    from,
    to: target,
    subject: "Test email — Stichting The V.O.I.C.E. NL Settings",
    html: `<p>This is a test email sent from the admin settings panel at ${new Date().toISOString()}.</p>`,
    text: "This is a test email from the admin settings panel.",
  });

  await settingsService.updateCategorySettings(
    "email_provider",
    { lastTestAt: new Date().toISOString(), lastTestStatus: "ok" },
    adminId
  );

  return { ok: true, sentTo: target };
}

export async function getOrgBranding() {
  const general = await settingsService.getCategorySettings("general");
  return {
    organizationName: general.foundationName || general.brandName || "Stichting The V.O.I.C.E. NL",
    websiteUrl: general.websiteUrl || env.clientUrl,
    supportEmail: general.supportEmail || env.org.contactEmail,
    contactEmail: general.contactEmail || env.org.contactEmail,
    financeEmail: general.financeEmail || general.contactEmail,
    footerCopyright: general.footerCopyright || "",
  };
}
