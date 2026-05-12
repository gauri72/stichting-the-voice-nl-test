// Tier coverage / benefits as supplied by the client for the sponsorship
// receipt and the thank-you email. Single source of truth so the PDF receipt
// and the email HTML cannot drift out of sync.

export const SPONSORSHIP_COVERAGE = [
  {
    id: "associate",
    name: "Associate Sponsor",
    amountLabel: "\u20AC300",
    benefits: [
      "Logo/name on sponsor section of website",
      "Social media thank-you mention",
      "Recognition in selected event materials",
      "Sponsor appreciation slide at event",
      "1 complimentary event pass"
    ]
  },
  {
    id: "silver",
    name: "Silver Sponsor",
    amountLabel: "\u20AC500",
    benefits: [
      "All Associate benefits",
      "Logo on selected posters or digital event creatives",
      "Sponsor mention in event program/page",
      "1 dedicated social media shout-out",
      "Public acknowledgement during event",
      "2 complimentary event passes"
    ]
  },
  {
    id: "gold",
    name: "Gold Sponsor",
    amountLabel: "\u20AC1,000",
    benefits: [
      "All Silver benefits",
      "Premium logo placement on website and event screen",
      "Logo on banners/posters where applicable",
      "Half-page sponsor feature in event program/page",
      "2 dedicated social media posts/reels/stories",
      "Opportunity to present an award or address audience briefly, if event format allows",
      "4 complimentary event passes"
    ]
  },
  {
    id: "platinum",
    name: "Platinum Sponsor",
    amountLabel: "\u20AC1,500+",
    benefits: [
      "All Gold benefits",
      "Recognition as Main Partner / Presenting Sponsor where applicable",
      "Full-page sponsor feature in event program/page",
      "Premium logo placement on main stage/screen and campaign creatives",
      "Brand mention in press/media communication where applicable",
      "Meet & greet or networking opportunity where applicable",
      "Category exclusivity subject to agreement",
      "6 complimentary event passes"
    ]
  }
];

export default SPONSORSHIP_COVERAGE;
