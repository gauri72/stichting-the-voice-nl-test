/** Display data for donation tier cards and supporting sections. */

export const DONATION_TIERS = [
  {
    id: "25",
    name: "Supporter",
    price: "€25",
    theme: "teal",
    popular: false,
    icon: "heart",
    description: "Help us keep cultural programs accessible to everyone.",
  },
  {
    id: "50",
    name: "Friend",
    price: "€50",
    theme: "pink",
    popular: false,
    icon: "masks",
    description: "Strengthen workshops, screenings, and community gatherings.",
  },
  {
    id: "100",
    name: "Champion",
    price: "€100",
    theme: "gold",
    popular: true,
    icon: "star",
    description: "Become a core supporter of our flagship events and outreach.",
  },
  {
    id: "250",
    name: "Patron",
    price: "€250",
    theme: "purple",
    popular: false,
    icon: "users",
    description: "Support larger initiatives and help expand our reach worldwide.",
  },
  {
    id: "500",
    name: "Visionary",
    price: "€500",
    theme: "orange",
    popular: false,
    icon: "gem",
    description: "Make a transformative impact and help shape a better future.",
  },
  {
    id: "custom",
    name: "Pay As You Wish",
    price: "Custom",
    theme: "orange",
    popular: false,
    icon: "heartHand",
    allowCustom: true,
    customOnly: true,
    description: "Give any amount you wish — every contribution helps our mission.",
  },
];

export const DONATION_ALLOCATION = [
  {
    title: "Arts & Culture",
    text: "Live performances, festivals, and creative showcases that celebrate diverse voices.",
    icon: "music",
  },
  {
    title: "Community Programs",
    text: "Neighbourhood events and gatherings that build trust, joy, and belonging.",
    icon: "users",
  },
  {
    title: "Education & Youth",
    text: "Workshops, mentorship, and learning paths that open doors for the next generation.",
    icon: "school",
  },
  {
    title: "Health & Wellness",
    text: "Initiatives that support wellbeing through culture, movement, and mindful connection.",
    icon: "heartbeat",
  },
  {
    title: "Cultural Exchange",
    text: "International collaborations that widen perspectives and deepen mutual respect.",
    icon: "globe",
  },
  {
    title: "Sustainability",
    text: "Greener events and responsible operations that care for people and planet.",
    icon: "leaf",
  },
];

export const DONATION_STATS = [
  { value: "10+", label: "High-Production Events", icon: "bolt" },
  { value: "3+", label: "Premier Venues", icon: "masks" },
  { value: "125+", label: "Artists Amplified", icon: "star" },
  { value: "12+", label: "Expert Members", icon: "users" },
  { value: "100+", label: "Joyful Hours of Happiness", icon: "smile" },
];

export const DONATION_OTHER_WAYS = [
  {
    title: "Corporate Partnerships",
    text: "Partner with us to create meaningful impact together.",
    icon: "handshake",
    href: "/sponsorship",
  },
  {
    title: "In-Kind Donations",
    text: "Support our cause by donating goods, services or resources.",
    icon: "gift",
    href: "mailto:info@stichtingthevoice.nl?subject=In-kind%20donation",
  },
  {
    title: "Volunteer With Us",
    text: "Give your time and skills to help our community thrive.",
    icon: "volunteer",
    href: "mailto:info@stichtingthevoice.nl?subject=Volunteering",
  },
];
