import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandYoutube,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { apiFetch } from "../../utils/api.js";
import { WHATSAPP_GROUP_URL } from "../../constants/siteLinks.js";
import headerLogo from "../../assets/header-logo.png";
import footerBg from "../../assets/footer-bg.png";
import voiceVentureStudioLogo from "../../assets/VOICE Venture Studio.png";
import "../../styles/footer.css";

function buildWhatsAppHref() {
  const raw = import.meta.env.VITE_WHATSAPP_E164;
  const digits =
    raw && typeof raw === "string" && raw.replace(/\D/g, "").length >= 8
      ? raw.replace(/\D/g, "")
      : "31619032104";
  return `https://wa.me/${digits}`;
}

const footerNavLinks = [
  { label: "Home", to: "/" },
  { label: "Experience", to: "/events" },
  { label: "Stories", to: "/segments/vision-of-sounds" },
  { label: "Impact", to: "/segments/vownl" },
  { label: "Innovation", to: "/voice-venture-studio" },
  { label: "Become A Member", to: "/membership" },
  { label: "Sponsor Us", to: "/sponsorship" },
  { label: "Donate", to: "/donate" },
  { label: "About Us", to: "/about-us" },
];

const footerLegalLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
];

const footerSiteLinks = [...footerNavLinks, ...footerLegalLinks];

const socialLinks = [
  {
    href: "https://www.facebook.com/p/The-VOICE-NL-61552129209396/",
    label: "Facebook",
    Icon: IconBrandFacebook,
  },
  {
    href: "https://www.instagram.com/stichting_the_voice_nl/?hl=en",
    label: "Instagram",
    Icon: IconBrandInstagram,
  },
  {
    href: "https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/",
    label: "LinkedIn",
    Icon: IconBrandLinkedin,
  },
  {
    href: "https://www.youtube.com/@StichtingTheVOICENL",
    label: "YouTube",
    Icon: IconBrandYoutube,
  },
  {
    href: "https://x.com/St_The_VOICE_NL",
    label: "X",
    Icon: IconBrandX,
  },
];

const DEFAULT_CONTACT_EMAIL = "info@stichtingthevoice.nl";

export default function Footer() {
  const [contactEmail, setContactEmail] = useState(DEFAULT_CONTACT_EMAIL);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    apiFetch("/api/public/site")
      .then((data) => {
        if (data?.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="site-footer site-footer--with-bg" style={{ "--footer-bg-image": `url(${footerBg})` }}>
      <div className="footer-main">
        <div className="footer-impact-strip">
          <div className="footer-impact-copy">
            <h2 className="footer-impact-title">Together, We Can</h2>
            <p className="footer-impact-subtitle">
              <span className="footer-impact-subtitle-blue">Create a </span>
              <span className="footer-impact-subtitle-green">Better Tomorrow.</span>
            </p>
          </div>

          <div
            className="footer-venture-credit footer-venture-credit--impact"
            aria-label="This website is designed and developed by V.O.I.C.E. Venture Studio"
          >
            <img
              className="footer-venture-logo"
              src={voiceVentureStudioLogo}
              alt="V.O.I.C.E. Venture Studio"
              loading="lazy"
            />
            <p className="footer-designed-by">
              This Website is
              <br />
              Designed &amp; Developed By
              <br />
              V.O.I.C.E. VENTURE STUDIO
            </p>
          </div>

          <div className="footer-impact-donate">
            <a
              className="footer-impact-donate-btn footer-impact-whatsapp-btn"
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden stroke={1.75} />
              JOIN WHATSAPP GROUP
            </a>
          </div>
        </div>

        <div className="footer-columns footer-columns--main">
          <div className="footer-col footer-col-brand">
            <div className="footer-brand-card">
              <div className="footer-brand-block">
                <img
                  className="footer-brand-logo"
                  src={headerLogo}
                  alt="Stichting The V.O.I.C.E. NL"
                  width={72}
                  height={72}
                />
                <div className="footer-brand-text">
                  <p className="footer-brand-top">Stichting</p>
                  <p className="footer-brand-name">
                    The V<span className="brand-tight-v-period">.</span>O.I.C.E. NL
                  </p>
                  <p className="footer-brand-tagline">
                    The vision of international cultural exchange in the Netherlands.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-col footer-col-follow">
            <h3 className="footer-section-title">Follow us</h3>
            <div className="footer-social-list footer-social-list--footer">
              {socialLinks.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon aria-hidden stroke={1.75} />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col footer-col-quick footer-col-links-legal">
            <h3 className="footer-section-title">Quick links</h3>
            <div className="footer-quick-grid footer-nav-grid">
              <ul className="footer-quick-row footer-nav-links">
                {footerSiteLinks.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="contact" className="footer-col footer-col-contact">
            <h3 className="footer-section-title">Contact us</h3>
            <div className="footer-brand-details footer-brand-details--standalone">
              <p>
                <span className="footer-brand-details-label">KVK</span>
                <span className="footer-brand-details-value">92180213</span>
              </p>
              <p>
                <span className="footer-brand-details-label">Address</span>
                <span className="footer-brand-details-value">
                  Wengehout 30,
                  <br />
                  2719 KA Zoetermeer,
                  <br />
                  The Netherlands
                </span>
              </p>
              <p>
                <span className="footer-brand-details-label">Email</span>
                <a
                  className="footer-brand-details-value footer-email"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
              </p>
              <p>
                <span className="footer-brand-details-label">Office Phone</span>
                <span className="footer-brand-details-value">+31619032104</span>
              </p>
            </div>
          </div>
        </div>

        <div className="footer-main-bottom">
          <p className="footer-tagline-celebrate">
            Together, we celebrate creativity, diversity, and harmony through art and culture.
          </p>
          <p className="footer-copyright">© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</p>
        </div>
      </div>

      {isChatOpen ? (
        <aside className="footer-whatsapp-widget" aria-label="WhatsApp chat">
          <div className="footer-whatsapp-header">
            <span>
              <IconBrandWhatsapp aria-hidden stroke={1.75} /> WhatsApp
            </span>
            <button type="button" onClick={() => setIsChatOpen(false)} aria-label="Close WhatsApp chat widget">
              <IconX aria-hidden stroke={1.75} />
            </button>
          </div>

          <div className="footer-whatsapp-body">
            <p>
              Hello <span aria-hidden>👋</span>
              <br />
              Can we help you?
            </p>
          </div>

          <a
            className="footer-whatsapp-open-chat"
            href={buildWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open WhatsApp chat"
          >
            Open chat
            <IconSend aria-hidden stroke={1.75} />
          </a>
        </aside>
      ) : (
        <button
          type="button"
          className="footer-whatsapp-fab"
          aria-label="Open WhatsApp chat widget"
          onClick={() => setIsChatOpen(true)}
        >
          <IconBrandWhatsapp aria-hidden stroke={1.75} />
        </button>
      )}
    </footer>
  );
}
