// Amounts in cents (EUR). Keep in sync with client/src/components/donate/DonateChooseImpactSection.jsx.
const DONATION_TIERS = {
  "25": {
    id: "25",
    name: "Supporter",
    amount: 2500,
    minAmount: 2500
  },
  "50": {
    id: "50",
    name: "Friend",
    amount: 5000,
    minAmount: 5000
  },
  "100": {
    id: "100",
    name: "Champion",
    amount: 10000,
    minAmount: 10000
  },
  "250": {
    id: "250",
    name: "Patron",
    amount: 25000,
    minAmount: 25000
  },
  "500": {
    id: "500",
    name: "Visionary",
    amount: 50000,
    minAmount: 50000
  },
  custom: {
    id: "custom",
    name: "Custom amount",
    amount: 50,
    minAmount: 50,
    allowCustom: true
  }
};

export function getDonationTier(id) {
  if (!id) return null;
  return DONATION_TIERS[String(id)] || null;
}

export default DONATION_TIERS;
