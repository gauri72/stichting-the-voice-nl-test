/** Display data for membership comparison table, plan cards, and CTA (reference layout). */

export const MEMBERSHIP_TIERS = [
  {
    id: "student",
    name: "Student",
    tableNameLines: ["Student"],
    price: "€15",
    theme: "pink",
    popular: false,
    icon: "school",
    description:
      "Perfect for students who want to explore, learn and stay connected with the community.",
    cardFeatures: [
      "Invitations to exclusive events",
      "Monthly newsletter",
      "Valid for 1 Year",
    ],
  },
  {
    id: "privilegedSingle",
    name: "Privileged Single",
    tableNameLines: ["Privileged", "Single"],
    price: "€30",
    theme: "teal",
    popular: false,
    icon: "user",
    description:
      "Designed for individuals who want more value, priority and savings.",
    cardFeatures: [
      "10% discount on tickets",
      "Invitations to exclusive events",
      "Monthly newsletter",
      "Valid for 1 Year",
    ],
  },
  {
    id: "privilegedFamily",
    name: "Privileged Family",
    tableNameLines: ["Privileged", "Family"],
    price: "€45",
    theme: "orange",
    popular: false,
    icon: "family",
    description:
      "Great for families who want to enjoy more together while saving more.",
    cardFeatures: [
      "20% discount on tickets",
      "Invitations to exclusive events",
      "Monthly newsletter",
      "Valid for 1 Year",
    ],
  },
  {
    id: "premiumSingle",
    name: "Premium Single",
    tableNameLines: ["Premium", "Single"],
    price: "€150",
    theme: "gold",
    popular: true,
    icon: "crown",
    description:
      "The ultimate experience for individuals who want the best of everything.",
    cardFeatures: [
      "FREE entry to all events",
      "100% discount on tickets",
      "Priority registration",
    ],
    moreBenefitsNote: "+ 6 more benefits",
  },
  {
    id: "premiumFamily",
    name: "Premium Family",
    tableNameLines: ["Premium", "Family"],
    price: "€250",
    theme: "purple",
    popular: false,
    icon: "crownFamily",
    description:
      "The complete family experience with premium benefits for everyone.",
    cardFeatures: [
      "FREE entry to all events",
      "100% discount on tickets",
      "Priority registration",
    ],
    moreBenefitsNote: "+ 6 more benefits",
  },
];

/** @typedef {'dash' | 'check' | 'text'} MembershipCellType */

/**
 * @type {Array<{
 *   benefit: string;
 *   student: { type: MembershipCellType; value?: string };
 *   privilegedSingle: { type: MembershipCellType; value?: string };
 *   privilegedFamily: { type: MembershipCellType; value?: string };
 *   premiumSingle: { type: MembershipCellType; value?: string };
 *   premiumFamily: { type: MembershipCellType; value?: string };
 * }>}
 */
export const MEMBERSHIP_COMPARISON_ROWS = [
  {
    benefit: "Discount on V.O.I.C.E. NL Tickets",
    student: { type: "dash" },
    privilegedSingle: { type: "text", value: "10%" },
    privilegedFamily: { type: "text", value: "20%" },
    premiumSingle: { type: "text", value: "100%" },
    premiumFamily: { type: "text", value: "100%" },
  },
  {
    benefit: "Priority Registration",
    student: { type: "dash" },
    privilegedSingle: { type: "dash" },
    privilegedFamily: { type: "dash" },
    premiumSingle: { type: "check" },
    premiumFamily: { type: "check" },
  },
  {
    benefit: "Free Entry to Events",
    student: { type: "dash" },
    privilegedSingle: { type: "dash" },
    privilegedFamily: { type: "dash" },
    premiumSingle: { type: "text", value: "All Events" },
    premiumFamily: { type: "text", value: "All Events" },
  },
  {
    benefit: "Invitations to Exclusive Events",
    student: { type: "check" },
    privilegedSingle: { type: "check" },
    privilegedFamily: { type: "check" },
    premiumSingle: { type: "check" },
    premiumFamily: { type: "check" },
  },
  {
    benefit: "Exclusive Access",
    student: { type: "dash" },
    privilegedSingle: { type: "dash" },
    privilegedFamily: { type: "dash" },
    premiumSingle: { type: "check" },
    premiumFamily: { type: "check" },
  },
  {
    benefit: "Meet & Greet with Artists",
    student: { type: "dash" },
    privilegedSingle: { type: "dash" },
    privilegedFamily: { type: "dash" },
    premiumSingle: { type: "check" },
    premiumFamily: { type: "check" },
  },
  {
    benefit: "Discount on Merchandise",
    student: { type: "dash" },
    privilegedSingle: { type: "dash" },
    privilegedFamily: { type: "dash" },
    premiumSingle: { type: "text", value: "10%" },
    premiumFamily: { type: "text", value: "10%" },
  },
  {
    benefit: "Discount on Partner Events",
    student: { type: "dash" },
    privilegedSingle: { type: "dash" },
    privilegedFamily: { type: "dash" },
    premiumSingle: { type: "text", value: "10%" },
    premiumFamily: { type: "text", value: "10%" },
  },
  {
    benefit: "Monthly Newsletter",
    student: { type: "check" },
    privilegedSingle: { type: "check" },
    privilegedFamily: { type: "check" },
    premiumSingle: { type: "check" },
    premiumFamily: { type: "check" },
  },
  {
    benefit: "Valid For",
    student: { type: "text", value: "1 Year" },
    privilegedSingle: { type: "text", value: "1 Year" },
    privilegedFamily: { type: "text", value: "1 Year" },
    premiumSingle: { type: "text", value: "1 Year" },
    premiumFamily: { type: "text", value: "1 Year", tone: "white" },
  },
];

export const MEMBERSHIP_HIGHLIGHT_TIER_ID = "premiumSingle";
