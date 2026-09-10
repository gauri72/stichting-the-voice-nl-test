import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/env.js";
import {
  getMailReplyTo,
  getSmtpTransporter,
  isMailerConfigured
} from "./smtpTransport.js";
import {
  buildEmailFollowUsRowHtml,
  getEmailSocialIconCids,
  loadEmailSocialIconAttachments
} from "./emailSocialIcons.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADER_LOGO_PATH = path.join(__dirname, "..", "..", "..", "client", "src", "assets", "header-logo.png");

/** @returns {import("nodemailer").Attachment | null} */
function loadHeaderLogoAttachment() {
  try {
    if (!fs.existsSync(HEADER_LOGO_PATH)) return null;
    return { filename: "header-logo.png", content: fs.readFileSync(HEADER_LOGO_PATH), cid: "voiceHeaderLogo" };
  } catch {
    console.warn("[authMailer] Could not load header-logo.png; email will omit logo.");
    return null;
  }
}

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
    if (env.nodeEnv !== "production") {
      console.warn("[authMailer] SMTP not configured — verification OTP:", otp);
    } else {
      console.warn("[authMailer] SMTP not configured — verification OTP email not sent.");
    }
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
    if (env.nodeEnv !== "production") {
      console.warn("[authMailer] SMTP not configured — password reset URL:", resetUrl);
    } else {
      console.warn("[authMailer] SMTP not configured — password reset email not sent.");
    }
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

const CLAIM_SOURCE_COPY = {
  ticket_purchase: "purchasing a ticket to one of our events",
  donation: "making a donation to Stichting The V.O.I.C.E. NL",
  sponsorship: "becoming a sponsor",
  volunteer_application: "applying to volunteer with us",
  venture_studio_inquiry: "reaching out to V.O.I.C.E. Venture Studio",
  vcommerce_purchase: "shopping with one of our V.Commerce partner businesses"
};

const CLAIM_BENEFITS = [
  {
    icon: "🎁",
    title: "Your own Referral Code",
    body: "Share it with friends and family — every time someone uses it, you earn Rewards you can track right from your dashboard."
  },
  {
    icon: "💳",
    title: "V.Wallet & Points",
    body: "Collect cashback and Points on your purchases, redeemable across the platform."
  },
  {
    icon: "🎟️",
    title: "My Bookings",
    body: "Every ticket and event booking in one place, with your QR codes ready whenever you need them."
  },
  {
    icon: "🛍️",
    title: "V.Commerce Orders",
    body: "Track every order from our partner businesses in one spot."
  },
  {
    icon: "🤝",
    title: "Your V.O.I.C.E. NL Impact",
    body: "One dashboard for your membership, events attended, donations made, and active sponsorships."
  },
  {
    icon: "⚡",
    title: "Faster next time",
    body: "No need to re-enter your details on your next ticket, donation, or order."
  }
];

/** Sent once, the first time a not-yet-seen email is auto-provisioned into a
 *  User account by userProvisioningService.js. `claimUrl` is a long-lived
 *  password-reset-style link (see authService.js's issueAccountClaimToken) —
 *  clicking it lands on the existing /reset-password page, which already
 *  clears isAutoProvisioned on submit. */
export async function sendAccountClaimEmail({ to, firstName, source, claimUrl }) {
  const actionText = CLAIM_SOURCE_COPY[source] || "using Stichting The V.O.I.C.E. NL";

  if (!isMailerConfigured()) {
    console.warn("[authMailer] SMTP not configured — account claim URL:", claimUrl);
    return { sent: false, devClaimUrl: claimUrl };
  }

  const transport = getSmtpTransporter();
  const name = escapeHtml(firstName || "there");
  const link = escapeHtml(claimUrl);

  const logoAttachment = loadHeaderLogoAttachment();
  const socialIconCids = getEmailSocialIconCids();
  const attachments = [
    ...(logoAttachment ? [logoAttachment] : []),
    ...loadEmailSocialIconAttachments()
  ];

  const benefitsHtml = CLAIM_BENEFITS.map(
    (b) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e4edf0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="34" style="font-size:20px;vertical-align:top;padding-right:10px;">${b.icon}</td>
              <td style="vertical-align:top;">
                <p style="margin:0 0 2px;font-weight:700;color:#0b2447;font-size:14px;">${escapeHtml(b.title)}</p>
                <p style="margin:0;color:#344054;font-size:13px;line-height:1.5;">${escapeHtml(b.body)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
  ).join("");

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#17314b;max-width:560px;margin:0 auto;background:#ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(118deg, #024556 0%, #003848 54%, #008080 100%);border-radius:12px 12px 0 0;">
        <tr>
          <td align="center" style="padding:28px 20px 24px;">
            ${logoAttachment ? `<img src="cid:voiceHeaderLogo" alt="Stichting The V.O.I.C.E. NL" width="64" height="64" style="display:block;margin:0 auto 12px;width:64px;height:auto;border:0;border-radius:12px;" />` : ""}
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">Create your V.O.I.C.E. NL account</p>
          </td>
        </tr>
      </table>

      <div style="padding:26px 22px 8px;">
        <p>Hi ${name},</p>
        <p>Thanks for ${escapeHtml(actionText)}! We noticed you don't have a Stichting The V.O.I.C.E. NL account yet with this email address, so we've set one up for you.</p>
      </div>

      <div style="margin:16px 22px 22px;padding:18px 18px 6px;background:#f4f9fa;border:1px solid #d9ecee;border-radius:12px;">
        <p style="margin:0 0 4px;color:#008080;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;">Why This Account Is Important For You</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${benefitsHtml}
        </table>
      </div>

      <div style="padding:0 22px;">
        <p style="margin:0 0 28px;text-align:center;">
          <a href="${link}" style="display:inline-block;padding:14px 28px;background:#008080;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">Create my account</a>
        </p>
        <p style="font-size:13px;color:#7a8ea3;">This link expires in 14 days. If you'd rather not create an account, no action is needed — you're all set either way.</p>
        <p style="font-size:12px;color:#9aabb8;word-break:break-all;">Or copy this link: ${link}</p>
      </div>

      <div style="padding:20px 22px 26px;margin-top:12px;border-top:1px solid #eef2f4;">
        ${buildEmailFollowUsRowHtml(socialIconCids)}
        <p style="margin:14px 0 0;font-size:11px;color:#9aabb8;">© ${new Date().getFullYear()} Stichting The V.O.I.C.E. NL. All rights reserved.</p>
      </div>
    </div>
  `;

  const benefitsText = CLAIM_BENEFITS.map((b) => `- ${b.title}: ${b.body}`).join("\n");

  await transport.sendMail({
    ...baseMailOptions(),
    to,
    subject: "Create your Stichting The V.O.I.C.E. NL account",
    html,
    text: `Hi ${firstName || "there"},\n\nThanks for ${actionText}! We've set up a Stichting The V.O.I.C.E. NL account for you.\n\nWhy this account is important for you:\n${benefitsText}\n\nCreate your account: ${claimUrl}\n\nThis link expires in 14 days. If you'd rather not, no action is needed.`,
    attachments
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
