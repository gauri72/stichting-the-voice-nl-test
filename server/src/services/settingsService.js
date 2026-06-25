import crypto from "crypto";
import AppSetting from "../models/AppSetting.js";
import SettingsAuditLog from "../models/SettingsAuditLog.js";
import {
  DEFAULT_GENERAL,
  DEFAULT_PAYMENT,
  DEFAULT_STRIPE,
  DEFAULT_BANK,
  DEFAULT_EMAIL_PROVIDER,
  SECRET_KEYS,
} from "../config/settingsConfig.js";
import { encryptSecret, decryptSecret, maskSecret, isEncryptedValue } from "../utils/secretEncryption.js";
import { getNextSequence } from "../utils/sequence.js";
import env from "../config/env.js";

const CATEGORY_DEFAULTS = {
  general: DEFAULT_GENERAL,
  payment: DEFAULT_PAYMENT,
  stripe: DEFAULT_STRIPE,
  bank: DEFAULT_BANK,
  email_provider: DEFAULT_EMAIL_PROVIDER,
  ticketing: {
    qrVerificationUrl: "",
    freeBookingAutoComplete: true,
    allowTicketResend: true,
    allowTicketPdfDownload: true,
    allowQrDownload: true,
    defaultTicketTerms: "",
    checkInEnabled: true,
    defaultSeatHoldMinutes: 10,
    enableReservedSeating: true,
    allowSeatChangesAfterBooking: true,
    requireSeatSelectionBeforeCheckout: true,
    defaultSeatMapZoom: 1,
    seatMapImageMaxSizeMb: 5,
  },
  membership: {
    expiryReminderDays: 30,
    membershipCodeFormat: "VNL-{year}-{seq}",
    qrVerificationUrl: "",
    ticketTailorLookupEnabled: true,
    membershipDiscountsEnabled: true,
    autoLinkExternalMemberships: true,
  },
  sponsorship: {
    paymentTermsDays: 30,
    receiptNumberFormat: "SPR-{year}-{seq}",
    defaultFinanceEmail: "",
  },
  donation: {
    receiptNumberFormat: "DON-{year}-{seq}",
    anonymousDonationsEnabled: true,
    recurringDonationsEnabled: true,
  },
  invoice: {
    invoiceNumberFormat: "INV-{year}-{seq}",
    paymentTermsDays: 30,
    defaultVatRate: 21,
    footerText: "",
    reminderScheduleDays: [7, 14],
    overdueScheduleDays: [30, 45],
  },
  security: {
    requireReauthForFinancialChanges: true,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    auditRetentionDays: 365,
  },
  integrations: {
    ticketTailorEnabled: true,
    ticketTailorApiKeySet: false,
    stripeEnabled: true,
    googleAnalyticsId: "",
    googleTagManagerId: "",
    whatsappUrl: "",
    youtubeUrl: "",
    googleMapsApiKeySet: false,
    pwaEnabled: true,
  },
  pdf_templates: {},
  // Text/link-only overrides for a few hardcoded Home page sections
  // (OurPillarsSection, GetInvolvedSection, ImpactStatsBar) — these
  // components keep their own layout/icons/CSS; only these values flow in.
  content_overrides: {
    pillar1Title: "V.O.I.C.E. Experience",
    pillar1Description: "Creating unforgettable cultural experiences.",
    pillar1Link: "/events",
    pillar2Title: "V.O.I.C.E. Stories",
    pillar2Description: "Sharing voices through Vision Of Sounds.",
    pillar2Link: "/stories",
    pillar3Title: "V.O.I.C.E. Impact",
    pillar3Description: "VOWNL • Social Work • Empowering communities through action.",
    pillar3Link: "/segments/vownl",
    pillar4Title: "V.O.I.C.E. Innovation",
    pillar4Description: "Building the future through technology.",
    pillar4Link: "/voice-venture-studio",
    involved1Title: "Sponsor Us",
    involved1Description: "Partner with us and create lasting impact together.",
    involved1Link: "/sponsorship",
    involved2Title: "Donate Now",
    involved2Description: "Your support helps us create meaningful change.",
    involved2Link: "/donate",
    involved3Title: "Volunteer",
    involved3Description: "Give your time and make a real difference.",
    stat1Value: "10+",
    stat1Label: "High Production Events",
    stat2Value: "3K +",
    stat2Label: "Lives Impacted",
    stat3Value: "125 +",
    stat3Label: "Artists Amplified",
    stat4Value: "1",
    stat4Label: "Global Community",
    eventsBreadcrumbImageLight: { url: "", alt: "" },
    eventsBreadcrumbImageDark: { url: "", alt: "" },
    impact1Label: "Join Us",
    impact1Heading: "Be Part of the Change",
    impact1Description: "Become a member or sponsor and help us continue creating meaningful impact through art and community.",
    impact1CtaText: "Become a Member",
    impact1CtaLink: "/membership",
    impact2Label: "Sponsor Us",
    impact2Heading: "Support. Empower. Transform.",
    impact2Description: "Your sponsorship helps us deliver cultural programs, elevate artists, and create wider community engagement.",
    impact2CtaText: "Become a Sponsor",
    impact2CtaLink: "/sponsorship",
    impact3Label: "Donate",
    impact3Heading: "Give Hope Through Culture.",
    impact3Description: "Every contribution powers inclusive events, nurtures young talent, and keeps community-led creativity thriving.",
    impact3CtaText: "Donate Now",
    impact3CtaLink: "/donate",

    // Shared across every page using VoiceBrandReveal (Stories, Impact,
    // Membership, About Us, Events breadcrumb headers).
    siteBrandTagline: "The Vision Of International Cultural Exchange In The Netherlands",
    sitePillarLine1: "Connecting Cultures.",
    sitePillarLine2: "Empowering Communities.",
    sitePillarLine3: "Creating Experiences.",
    sitePillarLine4: "Driving Innovation.",
    storiesBreadcrumbImageLight: { url: "", alt: "" },
    storiesBreadcrumbImageDark: { url: "", alt: "" },

    // Sponsorship page
    sponsorshipBreadcrumbImageLight: { url: "", alt: "" },
    sponsorshipBreadcrumbImageDark: { url: "", alt: "" },
    sponsorshipWhyHeading: "Why Sponsor Stichting The V.O.I.C.E. NL?",
    sponsorWhy1Title: "Community Impact",
    sponsorWhy1Description: "Empower diverse communities through the arts, culture, sports, and education.",
    sponsorWhy2Title: "Global Exposure",
    sponsorWhy2Description: "Reach a wide and engaged audience at international events and festivals.",
    sponsorWhy3Title: "Brand Visibility",
    sponsorWhy3Description: "Showcase your brand across multiple platforms, events, and marketing channels.",
    sponsorWhy4Title: "Positive Association",
    sponsorWhy4Description: "Align your brand with values of unity, diversity, creativity, and social good.",
    sponsorWhy5Title: "Long-term Value",
    sponsorWhy5Description: "Build lasting relationships and create measurable impact together.",

    // Impact page (namespaced "impactPage*" — distinct from Events' impact1-3 above)
    impactPageBreadcrumbImageLight: { url: "", alt: "" },
    impactPageBreadcrumbImageDark: { url: "", alt: "" },
    impactPageHerbeatsBrandName: "VOWNL",
    impactPageHerbeatsTagline: "Voice Of Women In The Netherlands",
    impactPageHerbeatsMotto: "We vow for women's welfare",
    impactPageHerbeatsTitle: "VOWNL - HerBeats",
    impactPageHerbeatsDescription: "A safe space where women uplift, support, and advocate for one another. Through the rhythm of shared experiences and collective strength, HerBeats celebrates the resilience of women, fosters connection, and champions equal opportunities for all.",
    impactPageHerbeatsQuote: "Here's to stronger voices, shared purpose, and a future led with compassion and courage.",
    impactPageHerbeatsCtaTitle: "Join the VOWNL - HerBeats Movement",
    impactPageHerbeatsCtaSubtitle: "Connect. Support. Empower.",
    impactPageHerbeatsCtaLink: "https://chat.whatsapp.com/GitDew5eqOB9ntDVU7XNgg",
    impactPageHighlightLabel: "VOWNL Highlight",
    impactPageHighlightTitle: "HerBeats Her Night",
    impactPageHighlightDescription: "An unforgettable evening celebrating women through music, connection, and shared stories — where every beat amplifies empowerment.",
    impactPageHighlightFeature1Title: "Empower",
    impactPageHighlightFeature1Description: "Building confidence and leadership among women.",
    impactPageHighlightFeature2Title: "Support",
    impactPageHighlightFeature2Description: "Creating networks of care and solidarity.",
    impactPageHighlightFeature3Title: "Advocate",
    impactPageHighlightFeature3Description: "Amplifying women's voices for lasting change.",
    impactPageHighlightLinkLabel: "View Highlights",
    impactPageHighlightLink: "/events",
    impactPageAreasHeading: "Our Areas Of Impact",
    impactPageArea1TitleLead: "Social Impact through ",
    impactPageArea1TitleAccent: "VOWNL",
    impactPageArea1Description: "Driving community support and women's welfare through inclusive programs that uplift, educate, and empower.",
    impactPageArea1Bullets: "Community Support Programs\nEducation & Awareness\nHealth & Wellbeing Initiatives\nWomen Empowerment",
    impactPageArea1ButtonLabel: "Learn More",
    impactPageArea1ButtonLink: "/membership",
    impactPageArea2TitleLead: "Youth Empowerment through ",
    impactPageArea2TitleAccent: "V.O.I.C.E. Venture Studio",
    impactPageArea2Description: "Empowering young changemakers with mentorship, innovation, and resources to turn bold ideas into meaningful ventures.",
    impactPageArea2Bullets: "Entrepreneurship & Innovation\nMentorship & Skills Development\nFunding & Resources\nLeadership Opportunities",
    impactPageArea2ButtonLabel: "Join Venture Studio WhatsApp Group",
    impactPageArea2ButtonLink: "https://chat.whatsapp.com/FLIGfmUxG0IEVv0xFxf3se",
    impactPageArea3TitleLead: "Helping Other ",
    impactPageArea3TitleAccent: "NGOs",
    impactPageArea3Description: "Collaborating with NGOs worldwide to amplify impact through shared resources, visibility, and cross-sector partnerships.",
    impactPageArea3Bullets: "Capacity Building & Resources\nCampaign Support & Visibility\nCross-Sector Partnerships\nGlobal NGO Network",
    impactPageArea3ButtonLabel: "Donate Now",
    impactPageArea3ButtonLink: "/donate",

    // About Us page
    aboutUsBreadcrumbImageLight: { url: "", alt: "" },
    aboutUsBreadcrumbImageDark: { url: "", alt: "" },
    aboutHeroTitleLead: "About",
    aboutHeroTitleAccent: "Us",
    aboutHeroTaglineLead: "Uniting Cultures. Amplifying Voices. Creating Lasting",
    aboutHeroTaglineAccent: "Impact.",
    aboutHeroDescription: "Stichting The V.O.I.C.E. NL is a non-profit organization dedicated to building an inclusive world where culture, creativity, and collaboration bring people together. We amplify voices, celebrate diversity, and create meaningful experiences that inspire communities across the Netherlands and beyond.",
    aboutMissionLabel: "Our Mission",
    // Left blank deliberately — the default rendering uses styled inline
    // highlight spans (see AboutUsMissionSection.jsx) that a flat override
    // can't reproduce. Setting this only takes effect once an admin opts in,
    // trading the highlight styling for a plain editable paragraph.
    aboutMissionText: "",
    aboutWhatWeDoHeading: "What We Do",
    aboutWhatWeDo1Title: "V.O.I.C.E. Experiences",
    aboutWhatWeDo1Description: "Creating unforgettable cultural experiences through events, festivals, and live performances.",
    aboutWhatWeDo1Link: "/events",
    aboutWhatWeDo2Title: "Voice of Visionaries",
    aboutWhatWeDo2Description: "Sharing leadership stories and ideas that inspire action and meaningful dialogue.",
    aboutWhatWeDo2Link: "/segments/voice-of-visionaries",
    aboutWhatWeDo3Title: "V.O.I.C.E. Impact",
    aboutWhatWeDo3Description: "Empowering communities through inclusion, education, volunteering, and social work.",
    aboutWhatWeDo3Link: "/segments/vownl",
    aboutWhatWeDo4Title: "V.O.I.C.E. Innovation",
    aboutWhatWeDo4Description: "Building the future through digital platforms, apps, and the V.O.I.C.E. Venture Studio.",
    aboutWhatWeDo4Link: "/voice-venture-studio",
    aboutValuesHeading: "Our Values - 5Is",
    aboutValue1Title: "Inclusion",
    aboutValue1Description: "Creating spaces where everyone belongs.",
    aboutValue2Title: "Integrity",
    aboutValue2Description: "Acting with honesty, transparency, and respect.",
    aboutValue3Title: "Innovation",
    aboutValue3Description: "Embracing new ideas to drive meaningful change.",
    aboutValue4Title: "Integration",
    aboutValue4Description: "Creating a sense of belonging through culture, connection, and community.",
    aboutValue5Title: "Impact",
    aboutValue5Description: "Transforming lives through culture and community.",

    // Donate page (tier pricing/checkout amounts intentionally excluded —
    // those are tied to real Stripe checkout logic, not safe to override
    // as disconnected text without risking a displayed-vs-charged mismatch)
    donateBreadcrumbImageLight: { url: "", alt: "" },
    donateBreadcrumbImageDark: { url: "", alt: "" },
    donateAllocationHeading: "Where Your Donation Goes",
    donateAllocation1Title: "Arts & Culture",
    donateAllocation1Description: "Live performances, festivals, and creative showcases that celebrate diverse voices.",
    donateAllocation2Title: "Community Programs",
    donateAllocation2Description: "Neighbourhood events and gatherings that build trust, joy, and belonging.",
    donateAllocation3Title: "Education & Youth",
    donateAllocation3Description: "Workshops, mentorship, and learning paths that open doors for the next generation.",
    donateAllocation4Title: "Health & Wellness",
    donateAllocation4Description: "Initiatives that support wellbeing through culture, movement, and mindful connection.",
    donateAllocation5Title: "Cultural Exchange",
    donateAllocation5Description: "International collaborations that widen perspectives and deepen mutual respect.",
    donateAllocation6Title: "Sustainability",
    donateAllocation6Description: "Greener events and responsible operations that care for people and planet.",
    donateImpactTitleLine: "Real Impact.",
    donateImpactTitleAccent: "Real Change.",
    donateStat1Value: "10+",
    donateStat1Label: "High-Production Events",
    donateStat2Value: "3+",
    donateStat2Label: "Premier Venues",
    donateStat3Value: "125+",
    donateStat3Label: "Artists Amplified",
    donateStat4Value: "12+",
    donateStat4Label: "Expert Members",
    donateStat5Value: "100+",
    donateStat5Label: "Joyful Hours of Happiness",
    donateOtherWaysHeading: "Other Ways to Give",
    donateOtherWay1Title: "Corporate Partnerships",
    donateOtherWay1Description: "Partner with us to create meaningful impact together.",
    donateOtherWay1Link: "/sponsorship",
    donateOtherWay2Title: "In-Kind Donations",
    donateOtherWay2Description: "Support our cause by donating goods, services or resources.",
    donateOtherWay2Link: "mailto:info@stichtingthevoice.nl?subject=In-kind%20donation",
    donateOtherWay3Title: "Volunteer With Us",
    donateOtherWay3Description: "Give your time and skills to help our community thrive.",
    donateOtherWay3Link: "mailto:info@stichtingthevoice.nl?subject=Volunteering",

    // Venture Studio / Innovation page
    ventureHeroTitleLead: "V.O.I.C.E.",
    ventureHeroTitleAccent: "Innovation.",
    ventureHeroDescription: "Innovating for impact. Building solutions that empower communities and accelerate growth in a digital world.",
    ventureDigitalTitle: "V.O.I.C.E. Digital",
    ventureDigitalDescription: "The main driver of innovation at V.O.I.C.E. NL. We leverage technology, data and creativity to build digital experiences, platforms and solutions that create real impact.",
    ventureDigitalPillar1Label: "Digital Transformation",
    ventureDigitalPillar2Label: "Data Driven Decisions",
    ventureDigitalPillar3Label: "Community Centric",
    ventureDigitalPillar4Label: "Innovation For Impact",
    ventureInitiativesHeading: "Our Key Initiatives",
    ventureInitiative1Title: "V.O.I.C.E. Venture Studio",
    ventureInitiative1Tagline: "Empowering ideas. Building the future.",
    ventureInitiative1Description: "Empowering changemakers with mentorship, innovation, and resources to turn bold ideas into meaningful ventures.",
    ventureInitiative1Bullets: "Entrepreneurship & Innovation\nMentorship & Skills Development\nFunding & Resources\nLeadership Opportunities",
    ventureInitiative2Title: "Consultancy Solutions",
    ventureInitiative2Tagline: "Expert guidance. Measurable results.",
    ventureInitiative2Description: "Strategic consultancy that helps organizations plan, optimize, and deliver measurable outcomes with clarity and confidence.",
    ventureInitiative2Bullets: "Strategy & Business Planning\nOperational Excellence\nDigital Transformation\nGrowth Strategy",
    ventureInitiative3Title: "Digital Growth",
    ventureInitiative3Tagline: "Scale your brand. Grow your impact.",
    ventureInitiative3Description: "Building digital presence and performance through marketing, content, and analytics that drive sustainable growth.",
    ventureInitiative3Bullets: "Digital Marketing\nBrand & Content Strategy\nPerformance Analytics\nScalable Solutions",
    ventureDeliverHeading: "What We Deliver",
    ventureDeliver1Title: "Purpose Driven Innovation",
    ventureDeliver1Description: "Solutions that create meaningful impact.",
    ventureDeliver2Title: "Empowered Communities",
    ventureDeliver2Description: "Tools and platforms that uplift and connect.",
    ventureDeliver3Title: "Sustainable Growth",
    ventureDeliver3Description: "Building long term value and impact.",
    ventureDeliver4Title: "Technology With Integrity",
    ventureDeliver4Description: "Responsible innovation for a better tomorrow.",
    ventureCtaTitleLead: "Innovate. Transform. ",
    ventureCtaTitleAccent: "Impact.",
    ventureCtaDescription: "Through technology, creativity and collaboration, we build the future with purpose.",
    ventureCtaButtonText: "Partner With Us",
    ventureCtaButtonLink: "/sponsorship",
    ventureContactPhone: "+31 6 19032104",
    ventureContactPhoneHref: "tel:+31619032104",
    ventureContactAddress: "Wengehout 30,\n2719 KA Zoetermeer,\nThe Netherlands",
    ventureContactKvk: "92180213",

    // Policies / Terms / Privacy page
    policiesHeroTitleLead: "POLICIES,",
    policiesHeroTitleAccent: "TERMS & CONDITIONS",
    policiesHeroTagline: "Transparency. Responsibility. Trust.",
    policiesHeroDescription: "At Stichting The V.O.I.C.E. NL, we are committed to operating with integrity, protecting your privacy, and ensuring a safe and respectful environment for everyone in our community.",
    policiesCommitmentTitle: "OUR COMMITMENT TO YOU",
    policiesCommitmentDescription: "We believe in ethical practices, clear communication, and responsible use of technology to serve our community with care and accountability.",
    policiesCommitmentPillar1Label: "Integrity",
    policiesCommitmentPillar2Label: "Privacy",
    policiesCommitmentPillar3Label: "Respect",
    policiesCommitmentPillar4Label: "Fairness",
    policiesGridHeading: "OUR POLICIES",
    policiesGrid1Title: "Privacy Policy",
    policiesGrid1Description: "How we collect, use, and protect your personal information when you interact with our website and services.",
    policiesGrid2Title: "Data Protection Policy",
    policiesGrid2Description: "Our approach to safeguarding data, ensuring compliance, and maintaining the highest standards of security.",
    policiesGrid3Title: "Cookie Policy",
    policiesGrid3Description: "Information about how we use cookies and similar technologies to improve your browsing experience.",
    policiesGrid4Title: "Community Guidelines",
    policiesGrid4Description: "Standards for respectful engagement, collaboration, and positive participation in our community.",
    policiesGrid5Title: "Event Terms & Conditions",
    policiesGrid5Description: "Terms governing participation in our events, including registration, conduct, and cancellation policies.",
    policiesGrid6Title: "Purchase & Refund Policy",
    policiesGrid6Description: "Details on payments, refunds, and financial transactions related to memberships, donations, and services.",
    policiesGrid7Title: "Code of Conduct",
    policiesGrid7Description: "Our expectations for ethical behaviour, professionalism, and accountability across all activities.",
    policiesGrid8Title: "Content Policy",
    policiesGrid8Description: "Guidelines for content creation, sharing, and usage across our platforms and community channels.",
    policiesTermsBannerTitle: "TERMS & CONDITIONS",
    policiesTermsBannerDescription: "These terms govern your use of our website, services, and participation in our programs. Please read them carefully before engaging with our platform.",
    policiesHelpTitle: "NEED HELP?",
    policiesHelpDescription: "If you have questions about our policies or need clarification on any terms, our team is here to assist you.",
    policiesHelpButtonText: "Contact Us on WhatsApp",
    policiesHelpButtonLink: "",
    // The 8 full policy texts below are pre-filled with the real current
    // text (paragraphs joined by a blank line) — editing renders identically
    // to the default, just via this field instead of the hardcoded array.
    policyPrivacy: "Stichting The V.O.I.C.E. NL respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, store, and safeguard information when you visit our website, register for events, become a member, or use our services.\n\nWe collect information you provide directly, such as your name, email address, phone number, and payment details when you register, donate, or contact us. We may also collect technical data including IP address, browser type, and usage patterns to improve our services.\n\nYour data is used to deliver our services, process transactions, communicate with you, and improve our platform. We do not sell your personal information to third parties. You may request access, correction, or deletion of your data by contacting us at info@stichtingthevoice.nl.",
    policyDataProtection: "We implement appropriate technical and organisational measures to protect personal data against unauthorised access, alteration, disclosure, or destruction. Our data protection practices align with applicable regulations including the GDPR.\n\nAccess to personal data is restricted to authorised personnel who require it to perform their duties. We regularly review our security measures and update our practices to address emerging threats.\n\nIn the event of a data breach that poses a risk to your rights, we will notify affected individuals and relevant authorities as required by law.",
    policyCookie: "Our website uses cookies and similar technologies to enhance your experience, analyse site traffic, and personalise content. Cookies are small text files stored on your device when you visit our site.\n\nWe use essential cookies required for the website to function, analytics cookies to understand how visitors use our site, and preference cookies to remember your settings such as theme and language.\n\nYou can manage cookie preferences through your browser settings or our cookie consent banner. Disabling certain cookies may affect the functionality of our website.",
    policyCommunity: "Our community thrives on respect, inclusion, and collaboration. All members, participants, and visitors are expected to treat others with dignity and refrain from harassment, discrimination, or harmful behaviour.\n\nWe encourage open dialogue and diverse perspectives while maintaining a safe environment. Content that promotes violence, hate speech, or illegal activity is not permitted on our platforms or at our events.\n\nViolations of these guidelines may result in removal from community spaces, cancellation of membership, or other appropriate action at our discretion.",
    policyEventTerms: "Registration for V.O.I.C.E. NL events constitutes acceptance of these terms. Event details, schedules, and venues may change; we will notify registered participants of significant changes.\n\nTickets and registrations are personal and may not be transferred without prior approval. Cancellation and refund policies vary by event and will be communicated at the time of registration.\n\nParticipants are responsible for their own conduct at events. Photography and recording may occur; by attending, you consent to being included in event documentation unless you notify organisers in advance.",
    policyPurchaseRefund: "All prices are displayed in euros unless otherwise stated. Payment is processed securely through our authorised payment providers. Membership fees, donations, and service charges are confirmed upon successful transaction.\n\nRefund eligibility depends on the type of purchase. Membership refunds are handled on a case-by-case basis within 14 days of purchase if no services have been accessed. Event ticket refunds follow the specific policy stated at registration.\n\nFor billing inquiries or refund requests, please contact info@stichtingthevoice.nl with your transaction reference.",
    policyCodeOfConduct: "Everyone associated with Stichting The V.O.I.C.E. NL — including staff, volunteers, partners, and participants — is expected to uphold the highest standards of integrity and professionalism.\n\nConflicts of interest must be disclosed promptly. Decisions should prioritise the organisation's mission and the wellbeing of our community over personal gain.\n\nReports of misconduct can be submitted confidentially to info@stichtingthevoice.nl. We take all reports seriously and will investigate promptly and fairly.",
    policyContent: "Content shared on our platforms must align with our mission and values. Users retain ownership of their content but grant us a licence to display and promote it in connection with our activities.\n\nWe reserve the right to remove content that violates our community guidelines, infringes intellectual property rights, or is otherwise inappropriate without prior notice.\n\nIf you believe content on our platform infringes your rights, please contact us with details and supporting evidence.",
    // Left blank deliberately — default rendering uses per-subsection H3
    // headings (see PoliciesDetailSection.jsx) that a flattened field can't
    // reproduce. Only takes effect once an admin opts in.
    policiesTermsConditionsText: "",

    // Membership page — breadcrumb image only. Tier names/prices/comparison
    // table are deliberately NOT exposed here: they're tied to real
    // membership checkout logic elsewhere, and a disconnected text override
    // could show a price that doesn't match what's actually charged.
    membershipBreadcrumbImageLight: { url: "", alt: "" },
    membershipBreadcrumbImageDark: { url: "", alt: "" },
  },
};

function throwError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

async function nextAuditId() {
  const seq = await getNextSequence("settings_audit");
  return `SET-AUD-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

function maskValue(key, value, isSecret) {
  if (value === null || value === undefined || value === "") return "";
  if (isSecret || SECRET_KEYS.stripe?.includes(key) || SECRET_KEYS.email_provider?.includes(key)) {
    const plain = isEncryptedValue(value) ? decryptSecret(value) : String(value);
    return maskSecret(plain);
  }
  if (typeof value === "object") return JSON.stringify(value).slice(0, 120);
  return String(value).slice(0, 200);
}

export async function logSettingsChange({ category, key, action, oldValue, newValue, isSecret, adminId, ip }) {
  await SettingsAuditLog.create({
    auditId: await nextAuditId(),
    category,
    key: key || "",
    action,
    oldValueMasked: maskValue(key, oldValue, isSecret),
    newValueMasked: maskValue(key, newValue, isSecret),
    changedBy: adminId,
    ipAddress: ip || "",
  });
}

async function getSettingDoc(category, key) {
  return AppSetting.findOne({ category, key }).lean();
}

export async function get(category, key, { includeSecret = false } = {}) {
  const doc = await getSettingDoc(category, key);
  if (!doc) {
    const defaults = CATEGORY_DEFAULTS[category];
    return defaults?.[key] ?? null;
  }
  if (doc.isSecret && doc.encrypted) {
    if (!includeSecret) return doc.value ? maskSecret(decryptSecret(doc.value)) : "";
    return decryptSecret(doc.value);
  }
  return doc.value;
}

export async function getSecret(category, key) {
  const doc = await getSettingDoc(category, key);
  if (!doc?.value) {
    if (category === "stripe" && key === "secretKey") return env.stripe.secretKey || "";
    if (category === "stripe" && key === "webhookSecret") return env.stripe.webhookSecret || "";
    if (category === "email_provider" && key === "smtpPassword") return env.email.pass || "";
    return "";
  }
  if (doc.encrypted) return decryptSecret(doc.value);
  return doc.value;
}

export async function getCategorySettings(category, { maskSecrets = true } = {}) {
  const defaults = { ...(CATEGORY_DEFAULTS[category] || {}) };
  const docs = await AppSetting.find({ category }).lean();

  for (const doc of docs) {
    if (doc.isSecret && doc.encrypted) {
      if (maskSecrets) {
        defaults[doc.key] = doc.value ? maskSecret(decryptSecret(doc.value)) : "";
        if (doc.key === "secretKey" || doc.key === "smtpPassword" || doc.key === "apiKey" || doc.key === "webhookSecret") {
          defaults[`${doc.key}Set`] = Boolean(doc.value);
        }
      } else {
        defaults[doc.key] = decryptSecret(doc.value);
      }
    } else {
      defaults[doc.key] = doc.value;
    }
  }

  if (category === "stripe") {
    if (!defaults.secretKeySet) defaults.secretKeySet = Boolean(env.stripe.secretKey);
    if (!defaults.webhookSecretSet) defaults.webhookSecretSet = Boolean(env.stripe.webhookSecret);
    if (!defaults.publishableKey && process.env.STRIPE_PUBLISHABLE_KEY) {
      defaults.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    }
    defaults.envConfigured = Boolean(env.stripe.secretKey);
    defaults.mode = defaults.mode || (env.stripe.secretKey?.startsWith("sk_live_") ? "live" : "test");
  }

  if (category === "email_provider") {
    if (!defaults.smtpPasswordSet) defaults.smtpPasswordSet = Boolean(env.email.pass);
    if (!defaults.senderEmail && env.email.from) defaults.senderEmail = env.email.from;
    if (!defaults.smtpHost && env.email.host) defaults.smtpHost = env.email.host;
    defaults.envConfigured = Boolean(env.email.host && env.email.user);
  }

  if (category === "bank") {
    const FinanceSettings = (await import("../models/FinanceSettings.js")).default;
    const finance = await FinanceSettings.findOne({ key: "default" }).lean();
    if (finance) {
      defaults.iban = defaults.iban || finance.iban || "";
      defaults.bic = defaults.bic || finance.bic || "";
      defaults.bankName = defaults.bankName || finance.bankName || "";
      defaults.accountHolderName = defaults.accountHolderName || finance.organizationName || "";
    }
  }

  if (category === "general") {
    defaults.supportEmail = defaults.supportEmail || env.org.contactEmail;
    defaults.websiteUrl = defaults.websiteUrl || env.clientUrl;
  }

  return defaults;
}

export async function updateCategorySettings(category, data, adminId, ip) {
  const secretKeys = SECRET_KEYS[category] || [];
  const results = {};

  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined) continue;
    if (key.endsWith("Set")) continue;

    const isSecret = secretKeys.includes(key) || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password") || key === "apiKey";
    const existing = await getSettingDoc(category, key);
    let storedValue = value;

    if (isSecret) {
      const replacement = String(value || "").trim();
      if (!replacement || replacement.includes("••••")) continue;
      storedValue = encryptSecret(replacement);
    }

    await AppSetting.findOneAndUpdate(
      { category, key },
      {
        $set: {
          settingsId: existing?.settingsId || `SET-${category}-${key}`,
          category,
          key,
          value: storedValue,
          encrypted: isSecret,
          isSecret,
          updatedBy: adminId,
        },
      },
      { upsert: true, new: true }
    );

    await logSettingsChange({
      category,
      key,
      action: "updated",
      oldValue: existing?.value,
      newValue: storedValue,
      isSecret,
      adminId,
      ip,
    });

    results[key] = isSecret ? maskSecret(value) : storedValue;
  }

  if (category === "bank") {
    await syncBankToFinanceSettings(data, adminId);
  }

  return getCategorySettings(category);
}

async function syncBankToFinanceSettings(data, adminId) {
  const FinanceSettings = (await import("../models/FinanceSettings.js")).default;
  const update = {};
  if (data.iban !== undefined) update.iban = data.iban;
  if (data.bic !== undefined) update.bic = data.bic;
  if (data.bankName !== undefined) update.bankName = data.bankName;
  if (data.accountHolderName !== undefined) update.organizationName = data.accountHolderName;
  if (Object.keys(update).length) {
    update.updatedBy = adminId;
    await FinanceSettings.findOneAndUpdate({ key: "default" }, { $set: update }, { upsert: true });
  }
}

export async function getAllSettingsSummary() {
  const summary = {};
  for (const category of Object.keys(CATEGORY_DEFAULTS)) {
    summary[category] = await getCategorySettings(category);
  }
  return summary;
}

export async function listAuditLogs({ limit = 50, category } = {}) {
  const query = category ? { category } : {};
  return SettingsAuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("changedBy", "name email firstName lastName")
    .lean();
}

export function generateTemplateId() {
  return `TPL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
