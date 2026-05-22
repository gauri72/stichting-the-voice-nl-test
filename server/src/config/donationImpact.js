// Tier impact copy for donation thank-you email and receipt PDF.
// Keep in sync with client/src/components/donate/DonateChooseImpactSection.jsx tier ids.

export const DONATION_IMPACT = [
  {
    id: "25",
    amount: "€25",
    tier: "Supporter",
    description: "Helps cover essential operational costs."
  },
  {
    id: "50",
    amount: "€50",
    tier: "Friend",
    description: "Supports programs that empower communities through arts and culture."
  },
  {
    id: "100",
    amount: "€100",
    tier: "Champion",
    description: "Enables impactful events that inspire, educate, and bring people together."
  },
  {
    id: "250",
    amount: "€250",
    tier: "Patron",
    description: "Supports larger initiatives and helps expand our reach worldwide."
  },
  {
    id: "500",
    amount: "€500+",
    tier: "Visionary",
    description: "Makes a transformative impact and helps shape a better future."
  },
  {
    id: "custom",
    amount: "Custom",
    tier: "Custom donation",
    description: "Give any amount you wish — every contribution helps our mission."
  }
];

/** Impact row for the opted donation tier. */
export function getDonationImpactForTier(tierId, options = {}) {
  if (!tierId) return null;
  const id = String(tierId).toLowerCase();
  const row = DONATION_IMPACT.find((tier) => tier.id === id);
  if (!row) return null;
  const amountLabel = options.amountLabel && String(options.amountLabel).trim();
  if (id === "custom" && amountLabel) {
    return { ...row, amount: amountLabel };
  }
  return row;
}

export default DONATION_IMPACT;
