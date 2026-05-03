import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPaperPlane,
  FaWhatsapp,
  FaYoutube,
  FaTimes,
} from "react-icons/fa";
import { IoMailOpenOutline } from "react-icons/io5";
import headerLogo from "../../assets/header-logo.png";
import "../../styles/footer.css";

// Set VITE_WHATSAPP_E164 in client/.env (digits only, e.g. 31619032104).
function buildWhatsAppHref() {
  const raw = import.meta.env.VITE_WHATSAPP_E164;
  const digits =
    raw && typeof raw === "string" && raw.replace(/\D/g, "").length >= 8
      ? raw.replace(/\D/g, "")
      : "31619032104";
  return `https://wa.me/${digits}`;
}

const quickLinks = [
  [
    { label: "Home", to: "/" },
    { label: "About Us", to: "/about" },
    { label: "Events", to: "/events" },
  ],
  [
    { label: "Sponsorship", to: "/sponsorship" },
    { label: "Membership", to: "/membership" },
    { label: "Film Festival", to: "/film-festival" },
  ],
  [
    { label: "Contact Us", to: "/contact" },
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms & Conditions", to: "/terms-and-conditions" },
  ],
];

const socialLinks = [
  {
    href: "https://www.facebook.com/p/The-VOICE-NL-61552129209396/",
    label: "Facebook",
    Icon: FaFacebookF,
  },
  {
    href: "https://www.instagram.com/stichting_the_voice_nl/?hl=en",
    label: "Instagram",
    Icon: FaInstagram,
  },
  {
    href: "https://www.youtube.com/@StichtingTheVOICENL",
    label: "YouTube",
    Icon: FaYoutube,
  },
  {
    href: "https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  }

  return (
    <footer className="site-footer">
      <div className="footer-newsletter">
        <div className="footer-newsletter-inner">
          <div className="footer-newsletter-copy">
            <IoMailOpenOutline className="footer-newsletter-icon" aria-hidden />
            <div>
              <h2>Stay connected</h2>
              <p>Subscribe to our newsletter for updates on events, stories and impact.</p>
            </div>
          </div>
          <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
            <label htmlFor="footer-newsletter-email" className="visually-hidden">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
                setSubscribed(false);
              }}
            />
            <button type="submit" className="footer-subscribe-btn">
              Subscribe
            </button>
            {subscribed ? (
              <p className="footer-subscribe-note" role="status">
                Thank you — we will be in touch.
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div className="footer-main">
        <div className="footer-columns">
          <div className="footer-col footer-col-brand">
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
                <p className="footer-brand-name">The V.O.I.C.E. NL</p>
                <p className="footer-brand-tagline">
                  The vision of international cultural exchange in the Netherlands.
                </p>
              </div>
            </div>
          </div>

          <div className="footer-col footer-col-links">
            <h3 className="footer-section-title">Quick links</h3>
            <div className="footer-quick-grid">
              <ul>
                {quickLinks.flat().map((item) => (
                  <li key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-col footer-col-social">
            <h3 className="footer-section-title">Follow us</h3>
            <div className="footer-social-list">
              {socialLinks.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-main-bottom">
          <p className="footer-tagline-celebrate">
            Together, we celebrate creativity, diversity, and harmony through art and culture.
          </p>
          <a className="footer-email" href="mailto:info@Stichtingthevoice.nl">
            info@Stichtingthevoice.nl
          </a>
          <p className="footer-copyright">© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</p>
        </div>
      </div>

      {isChatOpen ? (
        <aside className="footer-whatsapp-widget" aria-label="WhatsApp chat">
          <div className="footer-whatsapp-header">
            <span>
              <FaWhatsapp aria-hidden /> WhatsApp
            </span>
            <button type="button" onClick={() => setIsChatOpen(false)} aria-label="Close WhatsApp chat widget">
              <FaTimes aria-hidden />
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
            <FaPaperPlane aria-hidden />
          </a>
        </aside>
      ) : (
        <button
          type="button"
          className="footer-whatsapp-fab"
          aria-label="Open WhatsApp chat widget"
          onClick={() => setIsChatOpen(true)}
        >
          <FaWhatsapp aria-hidden />
        </button>
      )}
    </footer>
  );
}
