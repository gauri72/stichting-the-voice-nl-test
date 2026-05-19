/** Shown on donation thank-you emails and donation receipt PDF footers. */
export const DONATION_PUBLIC_CONTACT_DEFAULT = "info@stichtingthevoice.nl";

const LEGACY_PUBLIC_CONTACTS = new Set(["info@thevoicenl.org"]);

/**
 * @param {string | undefined} raw often process.env.CONTACT_EMAIL or a passed-through value
 * @returns {string}
 */
export function resolveDonationPublicContactEmail(raw) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return DONATION_PUBLIC_CONTACT_DEFAULT;
  if (LEGACY_PUBLIC_CONTACTS.has(trimmed.toLowerCase())) {
    return DONATION_PUBLIC_CONTACT_DEFAULT;
  }
  return trimmed;
}
