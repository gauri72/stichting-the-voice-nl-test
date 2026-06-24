export { sendTicketConfirmationEmail } from "../ticketMailer.js";
export { sendMembershipEmails } from "../membershipMailer.js";
export { sendDonationEmails, sendSponsorshipEmails } from "../mailer.js";

import { sendTicketConfirmationEmail } from "../ticketMailer.js";
import { sendMembershipEmails } from "../membershipMailer.js";
import { getSmtpTransporter, getMailFromAddress } from "../smtpTransport.js";

export async function sendBookingConfirmationEmail({ kind, payload }) {
  if (kind === "ticket") return sendTicketConfirmationEmail(payload);
  if (kind === "membership") return sendMembershipEmails(payload);
  if (kind === "simple") return sendSimpleEmail(payload);
  throw new Error(`Unsupported email kind: ${kind}`);
}

export async function sendSimpleEmail({ to, subject, html, text }) {
  const transport = getSmtpTransporter();
  if (!transport) return { sent: false, reason: "smtp_not_configured" };
  await transport.sendMail({
    from: getMailFromAddress(),
    to,
    subject,
    html,
    text: text || "",
  });
  return { sent: true };
}
