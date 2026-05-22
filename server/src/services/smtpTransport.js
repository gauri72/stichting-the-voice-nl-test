import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

export function isMailerConfigured() {
  return Boolean(env.email.host && env.email.user && env.email.pass && env.email.from);
}

function buildTransportOptions() {
  const port = env.email.port;
  const secure = env.email.secure;

  return {
    host: env.email.host,
    port,
    secure,
    auth: {
      user: env.email.user,
      pass: env.email.pass
    },
    // SiteGround and similar hosts: 465 = implicit TLS; 587 = STARTTLS
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
    tls: {
      minVersion: "TLSv1.2"
    },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000
  };
}

function buildTransporter() {
  if (!env.email.host || !env.email.user || !env.email.pass) {
    return null;
  }
  return nodemailer.createTransport(buildTransportOptions());
}

/** @returns {import("nodemailer").Transporter | null} */
export function getSmtpTransporter() {
  if (transporter) return transporter;
  transporter = buildTransporter();
  return transporter;
}

/** Default reply-to for transactional mail (public contact inbox). */
export function getMailReplyTo() {
  return env.org.contactEmail || env.email.user || undefined;
}

export function logMailConfiguration() {
  if (!isMailerConfigured()) {
    console.warn(
      "[mail] SMTP not fully configured — set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM in server/.env"
    );
    return;
  }
  console.log(
    `[mail] SMTP configured (${env.email.host}:${env.email.port}, secure=${env.email.secure}, from=${env.email.from})`
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
