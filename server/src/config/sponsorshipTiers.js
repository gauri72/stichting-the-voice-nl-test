// Authoritative price list. Amounts are in cents to avoid floating-point errors.
// Keep in sync with the tiers shown in client/src/components/sponsorship/SponsorshipTiersSection.jsx.
const SPONSORSHIP_TIERS = {
  associate: {
    id: "associate",
    name: "Associate Sponsor",
    amount: 30000,
    minAmount: 30000
  },
  silver: {
    id: "silver",
    name: "Silver Sponsor",
    amount: 50000,
    minAmount: 50000
  },
  gold: {
    id: "gold",
    name: "Gold Sponsor",
    amount: 100000,
    minAmount: 100000
  },
  platinum: {
    id: "platinum",
    name: "Platinum Sponsor",
    amount: 150000,
    minAmount: 150000
  },
  custom: {
    id: "custom",
    name: "Custom sponsor",
    amount: 50,
    minAmount: 50,
    allowCustom: true
  }
};

export function getTier(id) {
  if (!id) return null;
  return SPONSORSHIP_TIERS[String(id).toLowerCase()] || null;
}

export function listTiers() {
  return Object.values(SPONSORSHIP_TIERS);
}

export default SPONSORSHIP_TIERS;
