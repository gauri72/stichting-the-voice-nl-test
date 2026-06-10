import heroVisual from "../assets/Policies/policies-hero-legal.png";
import needHelpBg from "../assets/Policies/policies-need-help-skyline.png";
import { WHATSAPP_GROUP_URL } from "../constants/siteLinks.js";

export const POLICIES_HERO = {
  titleLead: "POLICIES,",
  titleAccent: "TERMS & CONDITIONS",
  tagline: "Transparency. Responsibility. Trust.",
  description:
    "At Stichting The V.O.I.C.E. NL, we are committed to operating with integrity, protecting your privacy, and ensuring a safe and respectful environment for everyone in our community.",
  visual: heroVisual,
};

export const POLICIES_COMMITMENT = {
  title: "OUR COMMITMENT TO YOU",
  description:
    "We believe in ethical practices, clear communication, and responsible use of technology to serve our community with care and accountability.",
  pillars: [
    { key: "integrity", icon: "shield", label: "Integrity" },
    { key: "privacy", icon: "lock", label: "Privacy" },
    { key: "respect", icon: "people", label: "Respect" },
    { key: "fairness", icon: "scale", label: "Fairness" },
  ],
};

export const POLICIES_GRID = [
  {
    key: "privacy",
    accent: "teal",
    icon: "shield-user",
    title: "Privacy Policy",
    description:
      "How we collect, use, and protect your personal information when you interact with our website and services.",
    anchor: "policy-privacy",
  },
  {
    key: "data-protection",
    accent: "purple",
    icon: "lock",
    title: "Data Protection Policy",
    description:
      "Our approach to safeguarding data, ensuring compliance, and maintaining the highest standards of security.",
    anchor: "policy-data-protection",
  },
  {
    key: "cookie",
    accent: "blue",
    icon: "cookie",
    title: "Cookie Policy",
    description:
      "Information about how we use cookies and similar technologies to improve your browsing experience.",
    anchor: "policy-cookie",
  },
  {
    key: "community",
    accent: "pink",
    icon: "people",
    title: "Community Guidelines",
    description:
      "Standards for respectful engagement, collaboration, and positive participation in our community.",
    anchor: "policy-community",
  },
  {
    key: "event-terms",
    accent: "teal",
    icon: "ticket",
    title: "Event Terms & Conditions",
    description:
      "Terms governing participation in our events, including registration, conduct, and cancellation policies.",
    anchor: "policy-event-terms",
  },
  {
    key: "purchase-refund",
    accent: "purple",
    icon: "cart",
    title: "Purchase & Refund Policy",
    description:
      "Details on payments, refunds, and financial transactions related to memberships, donations, and services.",
    anchor: "policy-purchase-refund",
  },
  {
    key: "code-of-conduct",
    accent: "blue",
    icon: "shield-check",
    title: "Code of Conduct",
    description:
      "Our expectations for ethical behaviour, professionalism, and accountability across all activities.",
    anchor: "policy-code-of-conduct",
  },
  {
    key: "content",
    accent: "pink",
    icon: "file-text",
    title: "Content Policy",
    description:
      "Guidelines for content creation, sharing, and usage across our platforms and community channels.",
    anchor: "policy-content",
  },
];

export const POLICIES_TERMS = {
  id: "terms-detail",
  title: "TERMS & CONDITIONS",
  description:
    "These terms govern your use of our website, services, and participation in our programs. Please read them carefully before engaging with our platform.",
  buttonLabel: "View Terms & Conditions",
  anchor: "terms-content",
};

export const POLICIES_HELP = {
  image: needHelpBg,
  title: "NEED HELP?",
  description:
    "If you have questions about our policies or need clarification on any terms, our team is here to assist you.",
  buttonLabel: "Contact Us on WhatsApp",
  buttonHref: WHATSAPP_GROUP_URL,
};

export const POLICIES_DISCLAIMER =
  "By using our website and services, you acknowledge that you have read, understood and agree to our policies and terms.";

export const POLICIES_DETAILS = [
  {
    id: "policy-privacy",
    title: "Privacy Policy",
    paragraphs: [
      "Stichting The V.O.I.C.E. NL respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, store, and safeguard information when you visit our website, register for events, become a member, or use our services.",
      "We collect information you provide directly, such as your name, email address, phone number, and payment details when you register, donate, or contact us. We may also collect technical data including IP address, browser type, and usage patterns to improve our services.",
      "Your data is used to deliver our services, process transactions, communicate with you, and improve our platform. We do not sell your personal information to third parties. You may request access, correction, or deletion of your data by contacting us at info@stichtingthevoice.nl.",
    ],
  },
  {
    id: "policy-data-protection",
    title: "Data Protection Policy",
    paragraphs: [
      "We implement appropriate technical and organisational measures to protect personal data against unauthorised access, alteration, disclosure, or destruction. Our data protection practices align with applicable regulations including the GDPR.",
      "Access to personal data is restricted to authorised personnel who require it to perform their duties. We regularly review our security measures and update our practices to address emerging threats.",
      "In the event of a data breach that poses a risk to your rights, we will notify affected individuals and relevant authorities as required by law.",
    ],
  },
  {
    id: "policy-cookie",
    title: "Cookie Policy",
    paragraphs: [
      "Our website uses cookies and similar technologies to enhance your experience, analyse site traffic, and personalise content. Cookies are small text files stored on your device when you visit our site.",
      "We use essential cookies required for the website to function, analytics cookies to understand how visitors use our site, and preference cookies to remember your settings such as theme and language.",
      "You can manage cookie preferences through your browser settings or our cookie consent banner. Disabling certain cookies may affect the functionality of our website.",
    ],
  },
  {
    id: "policy-community",
    title: "Community Guidelines",
    paragraphs: [
      "Our community thrives on respect, inclusion, and collaboration. All members, participants, and visitors are expected to treat others with dignity and refrain from harassment, discrimination, or harmful behaviour.",
      "We encourage open dialogue and diverse perspectives while maintaining a safe environment. Content that promotes violence, hate speech, or illegal activity is not permitted on our platforms or at our events.",
      "Violations of these guidelines may result in removal from community spaces, cancellation of membership, or other appropriate action at our discretion.",
    ],
  },
  {
    id: "policy-event-terms",
    title: "Event Terms & Conditions",
    paragraphs: [
      "Registration for V.O.I.C.E. NL events constitutes acceptance of these terms. Event details, schedules, and venues may change; we will notify registered participants of significant changes.",
      "Tickets and registrations are personal and may not be transferred without prior approval. Cancellation and refund policies vary by event and will be communicated at the time of registration.",
      "Participants are responsible for their own conduct at events. Photography and recording may occur; by attending, you consent to being included in event documentation unless you notify organisers in advance.",
    ],
  },
  {
    id: "policy-purchase-refund",
    title: "Purchase & Refund Policy",
    paragraphs: [
      "All prices are displayed in euros unless otherwise stated. Payment is processed securely through our authorised payment providers. Membership fees, donations, and service charges are confirmed upon successful transaction.",
      "Refund eligibility depends on the type of purchase. Membership refunds are handled on a case-by-case basis within 14 days of purchase if no services have been accessed. Event ticket refunds follow the specific policy stated at registration.",
      "For billing inquiries or refund requests, please contact info@stichtingthevoice.nl with your transaction reference.",
    ],
  },
  {
    id: "policy-code-of-conduct",
    title: "Code of Conduct",
    paragraphs: [
      "Everyone associated with Stichting The V.O.I.C.E. NL — including staff, volunteers, partners, and participants — is expected to uphold the highest standards of integrity and professionalism.",
      "Conflicts of interest must be disclosed promptly. Decisions should prioritise the organisation's mission and the wellbeing of our community over personal gain.",
      "Reports of misconduct can be submitted confidentially to info@stichtingthevoice.nl. We take all reports seriously and will investigate promptly and fairly.",
    ],
  },
  {
    id: "policy-content",
    title: "Content Policy",
    paragraphs: [
      "Content shared on our platforms must align with our mission and values. Users retain ownership of their content but grant us a licence to display and promote it in connection with our activities.",
      "We reserve the right to remove content that violates our community guidelines, infringes intellectual property rights, or is otherwise inappropriate without prior notice.",
      "If you believe content on our platform infringes your rights, please contact us with details and supporting evidence.",
    ],
  },
];

export const POLICIES_TERMS_CONTENT = {
  id: "terms-content",
  title: "Terms & Conditions",
  sections: [
    {
      heading: "1. Acceptance of Terms",
      body: "By accessing or using the Stichting The V.O.I.C.E. NL website and services, you agree to be bound by these Terms & Conditions and all applicable policies referenced on this page.",
    },
    {
      heading: "2. Use of Services",
      body: "You agree to use our website and services only for lawful purposes and in accordance with these terms. You must not misuse our platform, attempt unauthorised access, or interfere with the proper functioning of our services.",
    },
    {
      heading: "3. Intellectual Property",
      body: "All content on this website, including text, graphics, logos, images, and software, is the property of Stichting The V.O.I.C.E. NL or its licensors and is protected by copyright and other intellectual property laws.",
    },
    {
      heading: "4. Membership & Accounts",
      body: "If you create an account or purchase a membership, you are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must provide accurate and complete information.",
    },
    {
      heading: "5. Limitation of Liability",
      body: "To the fullest extent permitted by law, Stichting The V.O.I.C.E. NL shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or services.",
    },
    {
      heading: "6. Changes to Terms",
      body: "We may update these Terms & Conditions from time to time. Continued use of our services after changes are posted constitutes acceptance of the revised terms. We encourage you to review this page periodically.",
    },
    {
      heading: "7. Governing Law",
      body: "These terms are governed by the laws of the Netherlands. Any disputes shall be subject to the exclusive jurisdiction of the courts of the Netherlands.",
    },
    {
      heading: "8. Contact",
      body: "For questions about these Terms & Conditions, please contact us at info@stichtingthevoice.nl or via our WhatsApp community channel.",
    },
  ],
};
