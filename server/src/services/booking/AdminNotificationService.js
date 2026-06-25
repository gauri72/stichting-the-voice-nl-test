import { getSmtpTransporter, getMailFromAddress } from "../smtpTransport.js";

const DEFAULT_ADMIN_EMAIL = "info@stichtingthevoice.nl";

export function getAdminNotificationEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
}

export async function notifyAdminBooking({
  kind,
  subject,
  summary,
  details = {},
  to = null,
}) {
  const transport = getSmtpTransporter();
  const adminTo = to || getAdminNotificationEmail();
  if (!transport) {
    console.warn("[admin-notification] SMTP not configured:", kind, summary);
    return { sent: false, reason: "smtp_not_configured" };
  }

  const detailRows = Object.entries(details)
    .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${String(v ?? "")}</td></tr>`)
    .join("");

  const html = `
    <h2>${subject}</h2>
    <p>${summary}</p>
    <table border="1" cellpadding="6" cellspacing="0">${detailRows}</table>
    <p><small>Booking notification: ${kind}</small></p>
  `;

  await transport.sendMail({
    from: getMailFromAddress(),
    to: adminTo,
    subject: `[V.O.I.C.E.] ${subject}`,
    html,
    text: `${summary}\n${JSON.stringify(details, null, 2)}`,
  });

  return { sent: true, to: adminTo };
}

export async function notifyAdminTicketBooking({ order, event, tickets = [], paymentStatus = "paid" }) {
  return notifyAdminBooking({
    kind: "ticket_booking",
    subject: `New ticket booking — ${event?.title || "Event"}`,
    summary: `Order ${order?.orderNumber || order?.id} from ${order?.attendeeEmail || "guest"}`,
    details: {
      Event: event?.title,
      Reference: order?.orderNumber,
      Customer: `${order?.attendeeFirstName || ""} ${order?.attendeeLastName || ""}`.trim(),
      Email: order?.attendeeEmail,
      Tickets: tickets.length || order?.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0,
      Total: order?.grandTotalMinor != null ? `€${(order.grandTotalMinor / 100).toFixed(2)}` : "—",
      Payment: paymentStatus,
      Membership: order?.membershipBenefitApplied ? "Benefit applied" : "None",
    },
  });
}

export async function notifyAdminSessionBooking({ session, booking }) {
  return notifyAdminBooking({
    kind: "session_booking",
    subject: `Session booking — ${session?.title || "Session"}`,
    summary: `${booking?.email || "Guest"} booked a session`,
    details: {
      Session: session?.title,
      Slot: booking?.slotLabel || booking?.slotId,
      Email: booking?.email,
      Total: booking?.totalMinor != null ? `€${(booking.totalMinor / 100).toFixed(2)}` : "—",
    },
  });
}
