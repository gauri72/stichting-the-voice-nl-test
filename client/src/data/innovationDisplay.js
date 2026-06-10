import heroVisual from "../assets/Innovation/innovation-hero-lightbulb.png";
import ctaWorkspace from "../assets/Innovation/innovation-cta-workspace.png";
import ventureStudioLogo from "../assets/logos/VOICE Venture Studio_Copyright Logo(1).png";
import {
  VENTURE_STUDIO_WHATSAPP_URL,
  WHATSAPP_GROUP_URL,
} from "../constants/siteLinks.js";

export const INNOVATION_HERO = {
  titleLead: "V.O.I.C.E.",
  titleAccent: "Innovation.",
  description:
    "Innovating for impact. Building solutions that empower communities and accelerate growth in a digital world.",
  visual: heroVisual,
};

export const INNOVATION_DIGITAL = {
  brandMark: "V.",
  brandName: "V.O.I.C.E. DIGITAL",
  title: "V.O.I.C.E. Digital",
  description:
    "The main driver of innovation at V.O.I.C.E. NL. We leverage technology, data and creativity to build digital experiences, platforms and solutions that create real impact.",
  pillars: [
    { key: "transformation", icon: "globe", label: "Digital Transformation" },
    { key: "data", icon: "chart", label: "Data Driven Decisions" },
    { key: "community", icon: "people", label: "Community Centric" },
    { key: "impact", icon: "bulb", label: "Innovation For Impact" },
  ],
};

export const INNOVATION_INITIATIVES = [
  {
    key: "venture-studio",
    accent: "purple",
    icon: "rocket",
    logo: ventureStudioLogo,
    title: "V.O.I.C.E. Venture Studio",
    tagline: "Empowering ideas. Building the future.",
    description:
      "Empowering changemakers with mentorship, innovation, and resources to turn bold ideas into meaningful ventures.",
    items: [
      "Entrepreneurship & Innovation",
      "Mentorship & Skills Development",
      "Funding & Resources",
      "Leadership Opportunities",
    ],
    buttonLabel: "Join WhatsApp Group",
    buttonHref: VENTURE_STUDIO_WHATSAPP_URL,
    buttonStyle: "whatsapp",
  },
  {
    key: "consultancy",
    accent: "teal",
    icon: "people",
    title: "Consultancy Solutions",
    tagline: "Expert guidance. Measurable results.",
    description:
      "Strategic consultancy that helps organizations plan, optimize, and deliver measurable outcomes with clarity and confidence.",
    items: [
      "Strategy & Business Planning",
      "Operational Excellence",
      "Digital Transformation",
      "Growth Strategy",
    ],
    buttonLabel: "Connect With Us",
    buttonHref: WHATSAPP_GROUP_URL,
    buttonStyle: "whatsapp",
  },
  {
    key: "digital-growth",
    accent: "blue",
    icon: "chart",
    title: "Digital Growth",
    tagline: "Scale your brand. Grow your impact.",
    description:
      "Building digital presence and performance through marketing, content, and analytics that drive sustainable growth.",
    items: [
      "Digital Marketing",
      "Brand & Content Strategy",
      "Performance Analytics",
      "Scalable Solutions",
    ],
    buttonLabel: "Explore Services",
    buttonHref: "#vvs-contact",
    buttonStyle: "outline",
  },
];

export const INNOVATION_DELIVER = [
  {
    key: "purpose",
    icon: "target",
    title: "Purpose Driven Innovation",
    description: "Solutions that create meaningful impact.",
  },
  {
    key: "communities",
    icon: "people",
    title: "Empowered Communities",
    description: "Tools and platforms that uplift and connect.",
  },
  {
    key: "growth",
    icon: "globe",
    title: "Sustainable Growth",
    description: "Building long term value and impact.",
  },
  {
    key: "integrity",
    icon: "shield",
    title: "Technology With Integrity",
    description: "Responsible innovation for a better tomorrow.",
  },
];

export const INNOVATION_CTA = {
  image: ctaWorkspace,
  titleLead: "Innovate. Transform. ",
  titleAccent: "Impact.",
  description:
    "Through technology, creativity and collaboration, we build the future with purpose.",
  buttonLabel: "Partner With Us",
  buttonTo: "/sponsorship",
};
