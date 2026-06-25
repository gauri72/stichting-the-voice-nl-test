import { isMailerConfigured, getSmtpTransporter, getMailFromAddress } from "./smtpTransport.js";

const ORG_NAME = "Stichting The V.O.I.C.E. NL";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTemplate(html, vars) {
  let out = html;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), escapeHtml(val));
  }
  return out;
}

const BASE_STYLE = `
  font-family: 'Segoe UI', Arial, sans-serif;
  line-height: 1.6;
  color: #1a1a2e;
  max-width: 600px;
  margin: 0 auto;
`;

function wrapEmail(body) {
  return `<div style="${BASE_STYLE}">${body}</div>`;
}

async function sendEmail({ to, subject, html }) {
  if (!isMailerConfigured()) {
    console.warn("[discount-mailer] SMTP not configured, skipping email to", to);
    return false;
  }
  const transport = getSmtpTransporter();
  await transport.sendMail({
    from: getMailFromAddress(),
    to,
    subject,
    html: wrapEmail(html),
  });
  return true;
}

export async function sendPersonalCodeCreatedEmail({ email, firstName, discountCode, discountValue, expiryDate }) {
  const html = `
    <h2 style="color:#0891b2;">Your Personal Discount Code</h2>
    <p>Hi ${escapeHtml(firstName || "there")},</p>
    <p>A personal discount code has been created for you at ${ORG_NAME}.</p>
    <p style="font-size:24px;font-weight:bold;color:#7c3aed;letter-spacing:2px;">${escapeHtml(discountCode)}</p>
    <p>Discount: <strong>${escapeHtml(discountValue)}</strong></p>
    ${expiryDate ? `<p>Valid until: ${escapeHtml(expiryDate)}</p>` : ""}
    <p>Use this code during checkout to receive your discount.</p>
  `;
  return sendEmail({ to: email, subject: `Your personal discount code — ${ORG_NAME}`, html });
}

export async function sendReferralCodeCreatedEmail({ email, firstName, discountCode, referralLink }) {
  const html = `
    <h2 style="color:#0891b2;">Your Referral Code</h2>
    <p>Hi ${escapeHtml(firstName || "there")},</p>
    <p>Share your referral code and earn rewards when friends purchase tickets or memberships.</p>
    <p style="font-size:24px;font-weight:bold;color:#7c3aed;letter-spacing:2px;">${escapeHtml(discountCode)}</p>
    ${referralLink ? `<p><a href="${escapeHtml(referralLink)}" style="color:#0891b2;">Share your referral link</a></p>` : ""}
  `;
  return sendEmail({ to: email, subject: `Your referral code — ${ORG_NAME}`, html });
}

export async function sendReferralRewardEarnedEmail({ email, firstName, rewardValue }) {
  const html = `
    <h2 style="color:#0891b2;">Referral Reward Earned!</h2>
    <p>Hi ${escapeHtml(firstName || "there")},</p>
    <p>Great news! Someone used your referral code and you've earned a reward.</p>
    <p>Reward: <strong>${escapeHtml(rewardValue)}</strong></p>
    <p>Your reward is pending approval and will be processed shortly.</p>
  `;
  return sendEmail({ to: email, subject: `Referral reward earned — ${ORG_NAME}`, html });
}

export async function sendDiscountExpiringEmail({ email, firstName, discountCode, expiryDate, eventName }) {
  const html = `
    <h2 style="color:#f59e0b;">Discount Expiring Soon</h2>
    <p>Hi ${escapeHtml(firstName || "there")},</p>
    <p>Your discount code <strong>${escapeHtml(discountCode)}</strong> expires on ${escapeHtml(expiryDate)}.</p>
    ${eventName ? `<p>Valid for: ${escapeHtml(eventName)}</p>` : ""}
    <p>Don't miss out — use it before it expires!</p>
  `;
  return sendEmail({ to: email, subject: `Discount expiring soon — ${ORG_NAME}`, html });
}

export async function sendMembershipDiscountAppliedEmail({ email, firstName, discountValue, eventName }) {
  const html = `
    <h2 style="color:#0891b2;">Membership Discount Applied</h2>
    <p>Hi ${escapeHtml(firstName || "there")},</p>
    <p>Your membership discount of <strong>${escapeHtml(discountValue)}</strong> has been applied to your order.</p>
    ${eventName ? `<p>Event: ${escapeHtml(eventName)}</p>` : ""}
    <p>Thank you for being a member of ${ORG_NAME}!</p>
  `;
  return sendEmail({ to: email, subject: `Membership discount applied — ${ORG_NAME}`, html });
}

export { renderTemplate, ORG_NAME };
