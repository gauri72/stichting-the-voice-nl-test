// Header/footer navigation is CMS-editable, so its labels live in the
// database rather than translation files. Admin-entered labels stay as
// typed (same boundary as other CMS content), but the handful of
// well-known site destinations are translated by URL so the most common
// case — an admin using the default labels — still switches language.
const PATH_LABEL_KEYS = {
  "/": "common:nav.home",
  "/events": "common:nav.experience",
  "/stories": "common:nav.stories",
  "/impact": "common:nav.impact",
  "/voice-venture-studio": "common:nav.innovation",
  "/membership": "common:nav.becomeMember",
  "/sponsorship": "common:nav.sponsorUs",
  "/donate": "common:nav.donate",
  "/about-us": "common:nav.aboutUs",
  "/privacy-policy": "common:footer.quickLinks.policies",
  "/terms-and-conditions": "common:footer.quickLinks.policies",
};

export function translateKnownNavLabel(path, label, t) {
  const key = PATH_LABEL_KEYS[path];
  return key ? t(key) : label;
}

// Header CTA button text (Buy Tickets / Become A Member / Log In) is a CMS
// settings field, not a path-keyed nav item — matched by normalized text
// instead, tolerant of minor admin punctuation/spacing differences.
const KNOWN_TEXT_KEYS = [
  { test: (s) => /buy\s*tickets/i.test(s), key: "common:header.buyTickets" },
  { test: (s) => /log\s*in.*sign\s*up/i.test(s), key: "common:header.logInSignUp" },
  { test: (s) => /become\s*a\s*member/i.test(s), key: "common:nav.becomeMember" },
  { test: (s) => /^our\s*pillars$/i.test(s), key: "common:nav.ourPillars" },
  { test: (s) => /^partner\s*with\s*us$/i.test(s), key: "common:nav.partnerWithUs" },
  { test: (s) => /together,?\s*we\s*can/i.test(s), key: "common:footer.heroHeading" },
  { test: (s) => /better\s*tomorrow/i.test(s), key: "common:footer.heroSubheading" },
  { test: (s) => /positive\s*change/i.test(s), key: "common:footer.missionText" },
  { test: (s) => /stichting\s*the\s*v\.?o\.?i\.?c\.?e\.?\s*nl/i.test(s), key: "common:footer.copyrightText" },
  { test: (s) => /whatsapp.*group/i.test(s), key: "common:footer.whatsappButton" },
];

export function translateKnownLabel(text, t) {
  const match = KNOWN_TEXT_KEYS.find((entry) => entry.test(String(text || "")));
  return match ? t(match.key) : text;
}
