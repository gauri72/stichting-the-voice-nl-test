export { sendTicketConfirmationEmail } from "../ticketMailer.js";
export { sendMembershipEmails } from "../membershipMailer.js";
export { sendDonationEmails, sendSponsorshipEmails } from "../mailer.js";

import { getSmtpTransporter, getMailFromAddress } from "../smtpTransport.js";

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
