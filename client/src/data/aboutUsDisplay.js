import signatureEvents1 from "../assets/Events/signature-events-1.png";
import vownlImage from "../assets/Home/VOWNL.png";
import voiceOfVisionariesImage from "../assets/Home/Voice Of Visionaries.jpeg";
import ventureStudioImage from "../assets/VOICE Venture Studio.png";

export const ABOUT_HERO = {
  titleLead: "About",
  titleAccent: "Us",
  taglineLead: "Uniting Cultures. Amplifying Voices. Creating Lasting",
  taglineAccent: "Impact.",
  description:
    "Stichting The V.O.I.C.E. NL is a non-profit organization dedicated to building an inclusive world where culture, creativity, and collaboration bring people together. We amplify voices, celebrate diversity, and create meaningful experiences that inspire communities across the Netherlands and beyond.",
};

export const ABOUT_MISSION = {
  label: "Our Mission",
  textBefore: "Through ",
  highlights: ["artistic expression", "knowledge sharing", "social impact"],
  textMiddle:
    ", we empower individuals, amplify voices and strengthen communities to create a more inclusive and meaningful future. We remain committed to ",
  textAfter: " that connects people across cultures and generations.",
};

export const ABOUT_WHAT_WE_DO = [
  {
    title: "V.O.I.C.E. Experiences",
    description: "Creating unforgettable cultural experiences through events, festivals, and live performances.",
    image: signatureEvents1,
    to: "/events",
    accent: "teal",
  },
  {
    title: "Voice of Visionaries",
    description: "Sharing leadership stories and ideas that inspire action and meaningful dialogue.",
    image: voiceOfVisionariesImage,
    to: "/segments/voice-of-visionaries",
    accent: "magenta",
  },
  {
    title: "V.O.I.C.E. Impact",
    description: "Empowering communities through inclusion, education, volunteering, and social work.",
    image: vownlImage,
    to: "/segments/vownl",
    accent: "gold",
  },
  {
    title: "V.O.I.C.E. Innovation",
    description: "Building the future through digital platforms, apps, and the V.O.I.C.E. Venture Studio.",
    image: ventureStudioImage,
    to: "/voice-venture-studio",
    accent: "blue",
  },
];

export const ABOUT_VALUES = [
  { title: "Inclusion", description: "Creating spaces where everyone belongs." },
  { title: "Integrity", description: "Acting with honesty, transparency, and respect." },
  { title: "Innovation", description: "Embracing new ideas to drive meaningful change." },
  { title: "Collaboration", description: "Working together to amplify shared impact." },
  { title: "Impact", description: "Transforming lives through culture and community." },
];

export const ABOUT_IMPACT_STATS = [
  { value: "10,000+", label: "Lives Touched", accent: "teal" },
  { value: "2,500+", label: "Youth Empowered", accent: "magenta" },
  { value: "50+", label: "NGOs Supported", accent: "blue" },
  { value: "25+", label: "Communities Impacted", accent: "gold" },
];
