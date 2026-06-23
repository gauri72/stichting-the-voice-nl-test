/**
 * Build a public ticket PDF URL. Requires verification token for download.
 */
export function buildTicketPdfUrl(ticketNumber, verificationToken) {
  if (!ticketNumber) return "";
  const base = `/api/tickets/${encodeURIComponent(ticketNumber)}/pdf`;
  if (!verificationToken) return base;
  return `${base}?token=${encodeURIComponent(verificationToken)}`;
}

/**
 * Verify public ticket PDF access token.
 */
export function verifyTicketPdfAccess(ticket, token) {
  if (!ticket?.verificationToken) {
    const err = new Error("Ticket verification is not available.");
    err.status = 403;
    throw err;
  }
  if (!token || token !== ticket.verificationToken) {
    const err = new Error("Invalid or missing ticket verification token.");
    err.status = 403;
    throw err;
  }
}
