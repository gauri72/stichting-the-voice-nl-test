import env from "../config/env.js";
import {
  getMailReplyTo,
  getSmtpTransporter,
  isMailerConfigured
} from "./smtpTransport.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function baseMailOptions() {
  return {
    from: env.email.from,
    replyTo: getMailReplyTo()
  };
}

export async function sendVerificationOtpEmail({ to, firstName, otp }) {
  if (!isMailerConfigured()) {
    console.warn("[authMailer] SMTP not configured — verification OTP:", otp);
    return { sent: false, devOtp: otp };
  }

  const transport = getSmtpTransporter();
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
    ...baseMailOptions(),
    to,
    subject: "Your Stichting The V.O.I.C.E. NL verification code",
    html,
    text: `Hi ${firstName || "there"},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.`
  });

  return { sent: true };
}

export async function sendPasswordResetEmail({ to, firstName, resetUrl }) {
  if (!isMailerConfigured()) {
    console.warn("[authMailer] SMTP not configured — password reset URL:", resetUrl);
    return { sent: false, devResetUrl: resetUrl };
  }

  const transport = getSmtpTransporter();
  const name = escapeHtml(firstName || "there");
  const link = escapeHtml(resetUrl);

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;">
      <h1 style="color:#0d2847;font-size:22px;">Reset your password</h1>
      <p>Hi ${name},</p>
      <p>We received a request to reset the password for your Stichting The V.O.I.C.E. NL account. Click the button below to choose a new password:</p>
      <p style="margin:28px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 28px;background:#0d2847;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">Reset password</a>
      </p>
      <p style="font-size:13px;color:#7a8ea3;">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
      <p style="font-size:12px;color:#9aabb8;word-break:break-all;">Or copy this link: ${link}</p>
    </div>
  `;

  await transport.sendMail({
    ...baseMailOptions(),
    to,
    subject: "Reset your Stichting The V.O.I.C.E. NL password",
    html,
    text: `Hi ${firstName || "there"},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`
  });

  return { sent: true };
}

export async function sendPasswordChangedEmail({ to, firstName, when = new Date() }) {
  if (!isMailerConfigured()) {
    console.warn("[authMailer] SMTP not configured — password change confirmation skipped for", to);
    return { sent: false };
  }

  const transport = getSmtpTransporter();
  const name = escapeHtml(firstName || "there");
  const supportEmail = escapeHtml(env.org.contactEmail);
  const changedAt = escapeHtml(
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Amsterdam"
    }).format(when)
  );

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;">
      <h1 style="color:#0d2847;font-size:22px;">Your password was changed</h1>
      <p>Hi ${name},</p>
      <p>This is a confirmation that the password for your Stichting The V.O.I.C.E. NL account was successfully changed on <strong>${changedAt}</strong> (Amsterdam time).</p>
      <p style="margin:24px 0;padding:14px 16px;background:#f4f7fa;border-radius:8px;font-size:14px;color:#3d5568;">
        If you made this change, no further action is needed.
      </p>
      <p style="font-size:13px;color:#7a8ea3;">If you did <strong>not</strong> change your password, your account may be at risk. Please reset your password immediately and contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
    </div>
  `;

  await transport.sendMail({
    ...baseMailOptions(),
    to,
    subject: "Your Stichting The V.O.I.C.E. NL password was changed",
    html,
    text: `Hi ${firstName || "there"},\n\nThis confirms your account password was changed on ${changedAt} (Amsterdam time).\n\nIf you did not make this change, reset your password immediately and contact ${env.org.contactEmail}.`
  });

  return { sent: true };
}
