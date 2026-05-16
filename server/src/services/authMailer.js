import nodemailer from "nodemailer";
import env from "../config/env.js";
import { isMailerConfigured } from "./mailer.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.email.host || !env.email.user || !env.email.pass) return null;
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: { user: env.email.user, pass: env.email.pass }
  });
  return transporter;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendVerificationOtpEmail({ to, firstName, otp }) {
  if (!isMailerConfigured()) {
    console.warn("[authMailer] SMTP not configured — verification OTP:", otp);
    return { sent: false, devOtp: otp };
  }

  const transport = getTransporter();
  const name = escapeHtml(firstName || "there");
  const code = escapeHtml(otp);

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;">
      <h1 style="color:#0d2847;font-size:22px;">Your verification code</h1>
      <p>Hi ${name},</p>
      <p>Thanks for signing up with Stichting The V.O.I.C.E. NL. Enter this code on the sign-up page to activate your account:</p>
      <p style="margin:28px 0;font-size:32px;font-weight:800;letter-spacing:0.35em;color:#0d2847;">${code}</p>
      <p style="font-size:13px;color:#7a8ea3;">This code expires in 10 minutes. If you did not create an account, you can ignore this email.</p>
    </div>
  `;

  await transport.sendMail({
    from: env.email.from,
    to,
    subject: "Your Stichting The V.O.I.C.E. NL verification code",
    html,
    text: `Hi ${firstName || "there"},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.`
  });

  return { sent: true };
}
