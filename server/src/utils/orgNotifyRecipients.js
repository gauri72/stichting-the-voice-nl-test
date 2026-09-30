const SECONDARY_TRANSACTION_NOTIFY_EMAIL = "rajendra.rade@stichtingthevoice.nl";

/**
 * Adds rajendra.rade@stichtingthevoice.nl as a co-recipient whenever a
 * transaction notification (donation, sponsorship, membership, ticket/session
 * booking) resolves to the org's default info@ inbox — matches nodemailer's
 * comma-separated `to` format. Left untouched when a different address is
 * configured, since the ask was specifically to mirror what info@ receives.
 */
export function withSecondaryTransactionNotifyRecipient(primaryEmail) {
  if (!primaryEmail) return primaryEmail;
  const isInfoInbox = String(primaryEmail)
    .split(",")
    .some((addr) => addr.trim().toLowerCase() === "info@stichtingthevoice.nl");
  if (!isInfoInbox) return primaryEmail;
  return `${primaryEmail}, ${SECONDARY_TRANSACTION_NOTIFY_EMAIL}`;
}
