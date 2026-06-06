import env from "../config/env.js";
import { renderMembershipEmailHtml } from "./membershipTemplateService.js";
import { renderMembershipReceiptPdf } from "./membershipReceiptPdf.js";
import { getMailReplyTo, getSmtpTransporter, isMailerConfigured } from "./smtpTransport.js";

export { isMailerConfigured };

function baseMailOptions() {
  return {
    from: env.email.from,
    replyTo: getMailReplyTo()
  };
}

/**
 * @param {{ emailPayload: Record<string, string>, memberEmail: string }} payload
 */
export async function sendMembershipEmails(payload) {
  const tx = getSmtpTransporter();
  if (!tx || !env.email.from) {
    console.warn("[membershipMailer] Email not sent: SMTP/EMAIL_FROM not configured.");
    return { skipped: true };
  }

  const values = payload.emailPayload || {};
  const memberEmail = payload.memberEmail || values.member_email;
  if (!memberEmail) {
    console.warn("[membershipMailer] Email not sent: member email missing.");
    return { skipped: true };
  }

  const subject = "Your V.O.I.C.E. NL Membership Confirmation";
  const html = renderMembershipEmailHtml(values);
  const text = `Dear ${values.member_name},

Thank you for becoming a ${values.membership_type} member of Stichting The V.O.I.C.E. NL.

Membership ID: ${values.membership_id}
Valid from: ${values.valid_from}
Valid until: ${values.valid_until}
Receipt No: ${values.receipt_number}
Amount paid: €${values.amount_paid}
Payment reference: ${values.payment_reference}

View your membership: ${values.member_portal_url}

Stichting The V.O.I.C.E. NL`;

  let pdfBuffer = null;
  try {
    pdfBuffer = await renderMembershipReceiptPdf(values);
  } catch (error) {
    console.error("[membershipMailer] Failed to render membership receipt PDF:", error.message);
  }

  const attachments = pdfBuffer
    ? [
        {
          filename: `Membership-Receipt-${values.receipt_number || "VOICE"}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    : [];

  const tasks = [
    tx.sendMail({
      ...baseMailOptions(),
      to: memberEmail,
      subject,
      text,
      html,
      attachments
    })
  ];

  if (env.email.orgNotify) {
    tasks.push(
      tx.sendMail({
        ...baseMailOptions(),
        to: env.email.orgNotify,
        subject: `New membership: ${values.membership_type} — ${values.member_name}`,
        text: `A new membership was purchased.

Member: ${values.member_name}
Email: ${values.member_email}
Membership ID: ${values.membership_id}
Plan: ${values.membership_type}
Amount: €${values.amount_paid}
Receipt: ${values.receipt_number}
Payment reference: ${values.payment_reference}`
      })
    );
  }

  await Promise.allSettled(tasks);
  return { skipped: false };
}
