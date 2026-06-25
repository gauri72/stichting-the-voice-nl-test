import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;
let cachedConfigKey = null;
// Admin-configured email-provider settings (DB), when present, take priority
// over the static .env values — mirrors setRuntimeStripeSecrets in stripe.js.
let runtimeEmailConfig = null;

function activeEmailConfig() {
  return {
    host: runtimeEmailConfig?.host || env.email.host,
    port: runtimeEmailConfig?.port || env.email.port,
    secure: runtimeEmailConfig?.secure ?? env.email.secure,
    user: runtimeEmailConfig?.user || env.email.user,
    pass: runtimeEmailConfig?.pass || env.email.pass,
    from: runtimeEmailConfig?.from || env.email.from || env.email.membershipFrom || "",
  };
}

export function setRuntimeEmailConfig(config) {
  runtimeEmailConfig = config || null;
  transporter = null;
  cachedConfigKey = null;
}

export async function loadEmailSecretsFromSettings() {
  try {
    const { getEffectiveSmtpConfig } = await import("./emailProviderSettingsService.js");
    const config = await getEffectiveSmtpConfig();
    if (config?.host) setRuntimeEmailConfig(config);
  } catch {
    // Settings DB may be unavailable during startup
  }
}

export function getMailFromAddress() {
  return activeEmailConfig().from;
}

export function isMailerConfigured() {
  const cfg = activeEmailConfig();
  return Boolean(cfg.host && cfg.user && cfg.pass && cfg.from);
}

function buildTransportOptions() {
  const cfg = activeEmailConfig();

  return {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass
    },
    // SiteGround and similar hosts: 465 = implicit TLS; 587 = STARTTLS
    ...(cfg.port === 587 && !cfg.secure ? { requireTLS: true } : {}),
    tls: {
      minVersion: "TLSv1.2"
    },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000
  };
}

function buildTransporter() {
  const cfg = activeEmailConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return null;
  }
  return nodemailer.createTransport(buildTransportOptions());
}

/** @returns {import("nodemailer").Transporter | null} */
export function getSmtpTransporter() {
  const cfg = activeEmailConfig();
  const configKey = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (transporter && cachedConfigKey === configKey) return transporter;
  transporter = buildTransporter();
  cachedConfigKey = configKey;
  return transporter;
}

/** Default reply-to for transactional mail (public contact inbox). */
export function getMailReplyTo() {
  return env.org.contactEmail || activeEmailConfig().user || undefined;
}

export function logMailConfiguration() {
  const cfg = activeEmailConfig();
  if (!isMailerConfigured()) {
    console.warn(
      "[mail] SMTP not fully configured — set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM in server/.env or admin Email Provider settings"
    );
    return;
  }
  console.log(
    `[mail] SMTP configured (${cfg.host}:${cfg.port}, secure=${cfg.secure}, from=${cfg.from})`
  );
}

export async function verifySmtpConnection() {
  const tx = getSmtpTransporter();
  if (!tx) return false;
  try {
    await tx.verify();
    console.log("[mail] SMTP connection verified.");
    return true;
  } catch (error) {
    console.warn("[mail] SMTP verify failed:", error.message);
    return false;
  }
}
