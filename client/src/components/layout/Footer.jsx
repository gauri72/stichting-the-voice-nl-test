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
import { FaXTwitter } from "react-icons/fa6";
import { IoMailOpenOutline } from "react-icons/io5";
import headerLogo from "../../assets/header-logo.png";
import footerBg from "../../assets/footer-bg.png";
import voiceVentureStudioLogo from "../../assets/VOICE Venture Studio.png";
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

const quickLinksRow1 = [
  { label: "Home", to: "/" },
  { label: "Membership", to: "/membership" },
  { label: "Sponsorship", to: "/sponsorship" },
  { label: "Donate Now", to: "/donate" },
];

const quickLinksRow2 = [
  { label: "Vision of Sounds", to: "/segments/vision-of-sounds" },
  { label: "VOWNL", to: "/segments/vownl" },
  { label: "Voice of Visionaries", to: "/segments/voice-of-visionaries" },
];

const quickLinksRow3 = [
  { label: "Events", to: "/events" },
  { label: "My Account", to: "/my-account" },
  { label: "Blogs", to: "/blogs" },
  { label: "Chat With Us", href: buildWhatsAppHref() },
];

const quickLinksRow4 = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
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
    href: "https://www.linkedin.com/in/stichting-the-v-o-i-c-e-nl-b67427316/",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
  {
    href: "https://www.youtube.com/@StichtingTheVOICENL",
    label: "YouTube",
    Icon: FaYoutube,
  },
  {
    href: "https://x.com/St_The_VOICE_NL",
    label: "X",
    Icon: FaXTwitter,
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
    <footer className="site-footer site-footer--with-bg" style={{ "--footer-bg-image": `url(${footerBg})` }}>
      <div className="footer-main">
        <div className="footer-impact-strip">
          <div className="footer-impact-copy">
            <h2 className="footer-impact-title">Together, We Can</h2>
            <p className="footer-impact-subtitle">
              <span className="footer-impact-subtitle-blue">Create a </span>
              <span className="footer-impact-subtitle-green">Better Tomorrow.</span>
            </p>
            <p className="footer-impact-description">
              Thank you for believing in our mission and supporting the power of culture.
            </p>
          </div>

          <div className="footer-impact-donate">
            <Link className="footer-impact-donate-btn" to="/donate">
              DONATE NOW <span aria-hidden>♥</span>
            </Link>
            <p>Every act of kindness makes a lasting impact.</p>
          </div>
        </div>

        <div className="footer-stay-connected">
          <div className="footer-stay-connected-copy">
            <IoMailOpenOutline className="footer-stay-connected-icon" aria-hidden />
            <div>
              <h3>STAY CONNECTED</h3>
              <p>Subscribe to our newsletter for updates on events, stories and impact.</p>
            </div>
          </div>
          <form className="footer-stay-connected-form" onSubmit={handleSubscribe}>
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
            <button type="submit" className="footer-stay-connected-btn">
              SUBSCRIBE
            </button>
          </form>
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
                  <Icon aria-hidden />
                </a>
              ))}
            </div>
            <div
              className="footer-venture-credit"
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
          </div>

          <div className="footer-col footer-col-quick footer-col-links-legal">
            <h3 className="footer-section-title">Quick links</h3>
            <div className="footer-quick-grid footer-quick-grid--rows">
              <ul className="footer-quick-row footer-quick-row--four">
                {quickLinksRow1.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
              <ul className="footer-quick-row footer-quick-row--three">
                {quickLinksRow2.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
              <ul className="footer-quick-row footer-quick-row--four">
                {quickLinksRow3.map((item) => (
                  <li key={item.label}>
                    {"href" in item ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to}>{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="footer-quick-row footer-quick-row--two">
                {quickLinksRow4.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-col footer-col-contact">
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
                <span className="footer-brand-details-value">info@stichtingthevoice.nl</span>
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
        {subscribed ? (
          <p className="footer-subscribe-note footer-subscribe-note--center" role="status">
            Thank you — we will be in touch.
          </p>
        ) : null}
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
