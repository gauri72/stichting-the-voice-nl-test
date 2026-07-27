// Builds the referral share message/link and the deep links for specific channels.
// Native navigator.share() is left as an OS-level extra (mainly useful on mobile) rather
// than the only path — which apps show up in that sheet is entirely OS-controlled, so
// WhatsApp/Email get explicit deep links here to guarantee they're always available.

/** Turns a DiscountRule's discountType/discountValue into a short human label, e.g. "10%", "€5", "a free ticket". */
export function formatDiscountLabel(discountType, discountValue) {
  if (discountType === "percentage") return `${discountValue}%`;
  if (discountType === "fixed_amount") return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(discountValue || 0));
  return null; // free_ticket and anything unrecognized fall back to the generic message
}

/** Builds the referral event-listing link that captures ?ref= (see referralCapture.js). */
export function buildReferralUrl(code) {
  return `${window.location.origin}/events?ref=${encodeURIComponent(code)}`;
}

export function buildWhatsAppShareLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildEmailShareLink({ subject, body }) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
