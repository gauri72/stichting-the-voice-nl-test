import heroCrowd from "../assets/Impact/impact-hero-crowd.png";
import herbeatsWomen from "../assets/Impact/impact-herbeats-women.png";
import herbeatsHerNight from "../assets/Impact/impact-herbeats-her-night.png";
import socialHands from "../assets/Impact/impact-social-hands.png";
import youthCity from "../assets/Impact/impact-youth-city.png";
import ngoHands from "../assets/Impact/impact-ngo-hands.png";
import joinMovement from "../assets/Impact/impact-join-movement.png";
import vownlLogo from "../assets/logos/VOWNL Copyright HD Logo.png";
import ventureStudioLogo from "../assets/logos/VOICE Venture Studio_Copyright Logo(1).png";
import {
  VENTURE_STUDIO_WHATSAPP_URL,
  VOWNL_HERBEATS_WHATSAPP_URL,
} from "../constants/siteLinks.js";

export const IMPACT_HERO = {
  titleLead: "V.O.I.C.E.",
  titleAccent: "Impact",
  lines: [
    "Creating meaningful change.",
    "Empowering communities.",
    "Building a better tomorrow.",
  ],
  background: heroCrowd,
};

export const IMPACT_HERBEATS = {
  logo: vownlLogo,
  brandName: "VOWNL",
  brandTagline: "Voice Of Women In The Netherlands",
  brandMotto: "We vow for women's welfare",
  title: "VOWNL - HerBeats",
  description:
    "A safe space where women uplift, support, and advocate for one another. Through the rhythm of shared experiences and collective strength, HerBeats celebrates the resilience of women, fosters connection, and champions equal opportunities for all.",
  quote:
    "Here's to stronger voices, shared purpose, and a future led with compassion and courage.",
  sideImage: herbeatsWomen,
  cta: {
    title: "Join the VOWNL - HerBeats Movement",
    subtitle: "Connect. Support. Empower.",
    href: VOWNL_HERBEATS_WHATSAPP_URL,
  },
};

export const IMPACT_HIGHLIGHT = {
  label: "VOWNL Highlight",
  title: "HerBeats Her Night",
  description:
    "An unforgettable evening celebrating women through music, connection, and shared stories — where every beat amplifies empowerment.",
  image: herbeatsHerNight,
  linkLabel: "View Highlights",
  linkTo: "/events",
  features: [
    {
      key: "empower",
      title: "Empower",
      description: "Building confidence and leadership among women.",
    },
    {
      key: "support",
      title: "Support",
      description: "Creating networks of care and solidarity.",
    },
    {
      key: "advocate",
      title: "Advocate",
      description: "Amplifying women's voices for lasting change.",
    },
  ],
};

export const IMPACT_AREAS = [
  {
    key: "social",
    accent: "teal",
    icon: "heart-hands",
    titleLead: "Social Impact through ",
    titleAccent: "VOWNL",
    description:
      "Driving community support and women's welfare through inclusive programs that uplift, educate, and empower.",
    background: socialHands,
    items: [
      "Community Support Programs",
      "Education & Awareness",
      "Health & Wellbeing Initiatives",
      "Women Empowerment",
    ],
    buttonLabel: "Learn More",
    buttonTo: "/membership",
    buttonStyle: "outline",
  },
  {
    key: "youth",
    accent: "purple",
    icon: "rocket",
    titleLead: "Youth Empowerment through ",
    titleAccent: "V.O.I.C.E. Venture Studio",
    logo: ventureStudioLogo,
    description:
      "Empowering young changemakers with mentorship, innovation, and resources to turn bold ideas into meaningful ventures.",
    background: youthCity,
    items: [
      "Entrepreneurship & Innovation",
      "Mentorship & Skills Development",
      "Funding & Resources",
      "Leadership Opportunities",
    ],
    buttonLabel: "Join Venture Studio WhatsApp Group",
    buttonHref: VENTURE_STUDIO_WHATSAPP_URL,
    buttonStyle: "whatsapp",
  },
  {
    key: "ngo",
    accent: "blue",
    icon: "people",
    titleLead: "Helping Other ",
    titleAccent: "NGOs",
    description:
      "Collaborating with NGOs worldwide to amplify impact through shared resources, visibility, and cross-sector partnerships.",
    background: ngoHands,
    items: [
      "Capacity Building & Resources",
      "Campaign Support & Visibility",
      "Cross-Sector Partnerships",
      "Global NGO Network",
    ],
    buttonLabel: "Donate Now",
    buttonTo: "/donate",
    buttonStyle: "outline",
  },
];

export const IMPACT_STATS = [
  { value: "10,000+", label: "Lives Touched", accent: "teal", icon: "users" },
  { value: "2,500+", label: "Youth Empowered", accent: "purple", icon: "graduation" },
  { value: "50+", label: "NGOs Supported", accent: "teal", icon: "heart-hands" },
  { value: "25+", label: "Communities Impacted", accent: "purple", icon: "globe" },
];

export const IMPACT_JOIN_CTA = {
  image: joinMovement,
  titleLead: "Together, We Amplify ",
  titleAccent: "Impact.",
  description: "Join us in building a more inclusive, empowered, and connected future for all.",
  buttonLabel: "Join The Movement",
  buttonTo: "/membership",
};
