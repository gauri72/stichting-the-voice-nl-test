export const VCOMMERCE_PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: "€6.99",
    annual: "€69",
    founding: "€4.99",
    productLimit: 10,
    accent: "cyan",
    features: ["Hosted V.Commerce storefront", "Up to 10 products or services", "Secure checkout and seller dashboard"],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: "€14.99",
    annual: "€149",
    founding: "€9.99",
    productLimit: 50,
    accent: "green",
    features: ["Everything in Starter", "Up to 50 products or services", "Enhanced marketplace visibility"],
  },
  {
    id: "spotlight",
    name: "Spotlight",
    monthly: "€29.99",
    annual: "€299",
    founding: "€19.99",
    productLimit: 250,
    accent: "violet",
    features: ["Everything in Growth", "Up to 250 products or services", "Promotional and placement tools"],
  },
];

export const SELLING_MODES = [
  { id: "hosted", icon: "🏪", name: "Hosted by V.Commerce", description: "No website needed. We provide your storefront, checkout, orders and payouts." },
  { id: "external", icon: "↗", name: "My Existing Website", description: "Showcase your business here and send customers to your own online shop." },
  { id: "hybrid", icon: "✨", name: "Hybrid", description: "Sell selected products here while also linking to your existing website." },
];

export const PROMOTION_OPTIONS = [
  ["Popular Picks Boost", "7 days", "€4.99"],
  ["Category Feature", "14 days", "€7.99"],
  ["Business of the Week", "7 days", "€14.99"],
  ["Homepage Spotlight", "7 days", "€24.99"],
  ["Social Media Promotion", "Campaign", "€12.99"],
  ["Complete Promotion", "Bundle", "€39.99"],
];
