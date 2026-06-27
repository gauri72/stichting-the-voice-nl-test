import env from "../config/env.js";
import { getMailReplyTo, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseMailOptions() {
  return { from: env.email.from, replyTo: getMailReplyTo() };
}

function formatEur(minor) {
  return `€${(Number(minor) / 100).toFixed(2)}`;
}

export async function sendTopUpOtpEmail({ to, firstName, otp, amountMinor }) {
  if (!isMailerConfigured()) {
    if (env.nodeEnv !== "production") {
      console.warn("[walletMailer] SMTP not configured — top-up OTP:", otp);
    }
    return { sent: false, devOtp: otp };
  }
  const transport = getSmtpTransporter();
  const name = escapeHtml(firstName || "there");
  const code = escapeHtml(otp);
  const amount = formatEur(amountMinor);

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;">
      <h1 style="color:#0d2847;font-size:22px;">Confirm your V.Wallet top-up</h1>
      <p>Hi ${name},</p>
      <p>You're topping up your V.Wallet with ${amount}. Since this is a larger amount, please confirm with this code:</p>
      <p style="margin:28px 0;font-size:32px;font-weight:800;letter-spacing:0.35em;color:#0d2847;">${code}</p>
      <p style="font-size:13px;color:#7a8ea3;">This code expires in 10 minutes. If you didn't request this top-up, you can ignore this email.</p>
    </div>
  `;
  await transport.sendMail({
    ...baseMailOptions(),
    to,
    subject: "Confirm your V.Wallet top-up",
    html,
    text: `Hi ${firstName || "there"},\n\nYour V.Wallet top-up confirmation code is: ${otp}\n\nThis code expires in 10 minutes.`,
  });
  return { sent: true };
}

export async function sendTopUpConfirmationEmail({ to, firstName, amountMinor, newBalanceMinor }) {
  if (!isMailerConfigured()) return { sent: false };
  const transport = getSmtpTransporter();
  const name = escapeHtml(firstName || "there");
  const amount = formatEur(amountMinor);
  const balance = formatEur(newBalanceMinor);

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;">
      <h1 style="color:#0d2847;font-size:22px;">Your V.Wallet has been topped up</h1>
      <p>Hi ${name},</p>
      <p>We've added ${amount} to your V.Wallet. Your new balance is <strong>${balance}</strong>.</p>
      <p style="font-size:13px;color:#7a8ea3;">You can view your full transaction history any time from your dashboard.</p>
    </div>
  `;
  await transport.sendMail({
    ...baseMailOptions(),
    to,
    subject: "Your V.Wallet top-up is complete",
    html,
    text: `Hi ${firstName || "there"},\n\nWe've added ${amount} to your V.Wallet. Your new balance is ${balance}.`,
  });
  return { sent: true };
}

export async function sendAiBookingConfirmationEmail({ to, firstName, eventTitle, quantity, totalAmountMinor }) {
  if (!isMailerConfigured()) return { sent: false };
  const transport = getSmtpTransporter();
  const name = escapeHtml(firstName || "there");
  const amount = formatEur(totalAmountMinor);

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;">
      <h1 style="color:#0d2847;font-size:22px;">V.Assist booked your tickets</h1>
      <p>Hi ${name},</p>
      <p>Your personal AI assistant booked ${quantity} ticket${quantity === 1 ? "" : "s"} for <strong>${escapeHtml(eventTitle)}</strong>, paid from your V.Wallet (${amount}).</p>
      <p style="font-size:13px;color:#7a8ea3;">Didn't expect this? Review or revoke AI booking permission any time from your V.Wallet settings.</p>
    </div>
  `;
  await transport.sendMail({
    ...baseMailOptions(),
    to,
    subject: "V.Assist booked tickets using your V.Wallet",
    html,
    text: `Hi ${firstName || "there"},\n\nYour AI assistant booked ${quantity} ticket(s) for ${eventTitle}, paid from your V.Wallet (${amount}).`,
  });
  return { sent: true };
}
