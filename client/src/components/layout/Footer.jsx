import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandYoutube,
  IconBuilding,
  IconBulb,
  IconCrown,
  IconGift,
  IconHeart,
  IconHeartHandshake,
  IconHome,
  IconMail,
  IconMapPin,
  IconMicrophone,
  IconPhone,
  IconSend,
  IconShield,
  IconSparkles,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { apiFetch } from "../../utils/api.js";
import { WHATSAPP_GROUP_URL } from "../../constants/siteLinks.js";
import footerBg from "../../assets/footer-bg.png";
import voiceNlLogo from "../../assets/logos/V.O.I.C.E. NL Copyright HD Logo.png";
import voiceVentureStudioLogo from "../../assets/VOICE Venture Studio.png";
import FooterPwaDownloads from "./FooterPwaDownloads.jsx";
import "../../styles/footer.css";
import "../../styles/footer-mobile.css";
import "../../styles/footer-desktop.css";
import "../../styles/footer-pwa-downloads.css";

function buildWhatsAppHref() {
  const raw = import.meta.env.VITE_WHATSAPP_E164;
  const digits =
    raw && typeof raw === "string" && raw.replace(/\D/g, "").length >= 8
      ? raw.replace(/\D/g, "")
      : "31619032104";
  return `https://wa.me/${digits}`;
}

const footerQuickLinks = [
  { label: "Home", to: "/", Icon: IconHome },
  { label: "Experience", to: "/events", Icon: IconSparkles },
  { label: "Become a member", to: "/membership", Icon: IconCrown },
  { label: "Sponsor us", to: "/sponsorship", Icon: IconHeartHandshake },
  { label: "Donate", to: "/donate", Icon: IconGift },
  { label: "Stories", to: "/stories", Icon: IconMicrophone },
  { label: "Impact", to: "/impact", Icon: IconHeartHandshake },
  { label: "Innovation", to: "/voice-venture-studio", Icon: IconBulb },
  { label: "About us", to: "/about-us", Icon: IconUsers },
  { label: "Policies, terms & conditions", to: "/privacy-policy", Icon: IconShield },
];

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

function FooterSectionTitle({ children }) {
  return (
    <h3 className="footer-mobile-section-title">
      <span className="footer-mobile-section-title__line" aria-hidden="true" />
      <span>{children}</span>
      <span className="footer-mobile-section-title__line" aria-hidden="true" />
    </h3>
  );
}

function FooterMobileDivider({ variant = "dot" }) {
  return (
    <div className="footer-mobile-divider" aria-hidden="true">
      <span className="footer-mobile-divider__line" />
      {variant === "heart" ? (
        <IconHeart className="footer-mobile-divider__heart" stroke={1.75} />
      ) : (
        <span className="footer-mobile-divider__dot" />
      )}
      <span className="footer-mobile-divider__line" />
    </div>
  );
}

function FooterDesktopQuickLink({ label, to, Icon }) {
  return (
    <Link to={to} className="footer-desktop-quick-link">
      <span className="footer-desktop-quick-link__icon">
        <Icon aria-hidden stroke={1.75} />
      </span>
      <span className="footer-desktop-quick-link__label">{label}</span>
    </Link>
  );
}

function FooterDesktopContactCard({ label, value, href, accent, Icon }) {
  return (
    <article className={`footer-desktop-contact-card footer-desktop-contact-card--${accent}`}>
      <span className="footer-desktop-contact-card__icon">
        <Icon aria-hidden stroke={1.75} />
      </span>
      <div className="footer-desktop-contact-card__body">
        <span className="footer-desktop-contact-card__label">{label}</span>
        <p className="footer-desktop-contact-card__value">
          {href ? (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {value}
            </a>
          ) : (
            value
          )}
        </p>
      </div>
    </article>
  );
}

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

  const contactCards = [
    {
      label: "KVK",
      value: "92180213",
      accent: "blue",
      Icon: IconBuilding,
    },
    {
      label: "Address",
      value: "Wengehout 30, 2719 KA Zoetermeer, Netherlands",
      accent: "green",
      Icon: IconMapPin,
    },
    {
      label: "Email",
      value: contactEmail,
      href: `mailto:${contactEmail}`,
      accent: "purple",
      Icon: IconMail,
    },
    {
      label: "Mobile",
      value: "+31619032104",
      href: "tel:+31619032104",
      accent: "teal",
      Icon: IconPhone,
    },
  ];

  const desktopContactCards = contactCards;

  return (
    <footer className="site-footer site-footer--with-bg" style={{ "--footer-bg-image": `url(${footerBg})` }}>
      <div className="footer-mobile">
        <div className="footer-mobile-hero">
          <IconHeart className="footer-mobile-hero__heart" aria-hidden stroke={1.75} />

          <h2 className="footer-mobile-hero__title">Together, We Can</h2>
          <div className="footer-mobile-hero__subtitle-wrap">
            <p className="footer-mobile-hero__subtitle">
              <span className="footer-mobile-hero__subtitle-blue">Create a </span>
              <span className="footer-mobile-hero__subtitle-green">Better</span>
              <span className="footer-mobile-hero__subtitle-green-light"> Tomorrow.</span>
            </p>
          </div>

          <FooterMobileDivider />

          <div className="footer-mobile-hero__brand">
            <img
              className="footer-mobile-hero__logo"
              src={voiceNlLogo}
              alt=""
              loading="lazy"
            />
            <p className="footer-mobile-hero__brand-name">V.O.I.C.E. NL</p>
          </div>

          <FooterMobileDivider />

          <a
            className="footer-mobile-whatsapp-btn"
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandWhatsapp className="footer-mobile-whatsapp-btn__icon" aria-hidden stroke={1.75} />
            <span>Join WhatsApp Group</span>
          </a>
        </div>

        <section className="footer-mobile-section" aria-label="Follow us">
          <FooterSectionTitle>Follow Us</FooterSectionTitle>
          <div className="footer-mobile-social">
            {socialLinks.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Icon aria-hidden stroke={1.75} />
              </a>
            ))}
          </div>
        </section>

        <section className="footer-mobile-section" aria-label="Quick links">
          <FooterSectionTitle>Quick Links</FooterSectionTitle>
          <div className="footer-mobile-quick-grid">
            {footerQuickLinks.map(({ label, to, Icon }) => (
              <Link key={to} to={to} className="footer-mobile-quick-link">
                <span className="footer-mobile-quick-link__icon">
                  <Icon aria-hidden stroke={1.75} />
                </span>
                <span className="footer-mobile-quick-link__label">{label}</span>
                <span className="footer-mobile-quick-link__chevron" aria-hidden="true">
                  &gt;
                </span>
              </Link>
            ))}
          </div>
          <FooterPwaDownloads variant="mobile" />
        </section>

        <section className="footer-mobile-section" id="contact" aria-label="Contact us">
          <FooterSectionTitle>Contact Us</FooterSectionTitle>
          <div className="footer-mobile-contact-grid">
            {contactCards.map(({ label, value, href, accent, Icon }) => (
              <article
                key={label}
                className={`footer-mobile-contact-card footer-mobile-contact-card--${accent}`}
              >
                <span className="footer-mobile-contact-card__icon">
                  <Icon aria-hidden stroke={1.75} />
                </span>
                <div className="footer-mobile-contact-card__body">
                  <span className="footer-mobile-contact-card__label">{label}</span>
                  <p className="footer-mobile-contact-card__value">
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="footer-mobile-credit" aria-label="Designed and developed by V.O.I.C.E. Venture Studio">
          <FooterMobileDivider variant="heart" />

          <p className="footer-mobile-credit__heading">
            <span className="footer-mobile-credit__heading-line" aria-hidden="true" />
            <span>Proudly Designed &amp; Developed By</span>
            <span className="footer-mobile-credit__heading-line" aria-hidden="true" />
          </p>

          <div className="footer-mobile-credit__brand">
            <img
              className="footer-mobile-credit__logo"
              src={voiceVentureStudioLogo}
              alt=""
              loading="lazy"
            />
            <div className="footer-mobile-credit__brand-text">
              <div className="footer-mobile-credit__name">
                <span className="footer-mobile-credit__name-voice">V.O.I.C.E.</span>
                <span className="footer-mobile-credit__name-studio">VENTURE STUDIO</span>
              </div>
              <p className="footer-mobile-credit__tagline">Digital • Design • Innovation</p>
            </div>
          </div>
        </div>

        <p className="footer-mobile-copyright">
          <IconShield aria-hidden stroke={1.75} />
          <span>© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</span>
        </p>
      </div>

      <div className="footer-desktop">
        <div className="footer-desktop-hero">
          <div className="footer-desktop-hero__main">
            <div className="footer-desktop-hero__headline">
              <h2 className="footer-desktop-hero__title">Together, We Can</h2>
              <p className="footer-desktop-hero__subtitle">
                <span className="footer-desktop-hero__subtitle-blue">Create a </span>
                <span className="footer-desktop-hero__subtitle-green">Better Tomorrow.</span>
              </p>
            </div>

            <div className="footer-desktop-brand">
              <img
                className="footer-desktop-brand__logo"
                src={voiceNlLogo}
                alt=""
                loading="lazy"
              />
              <div className="footer-desktop-brand__identity">
                <p className="footer-desktop-brand__name">V.O.I.C.E. NL</p>
              </div>
              <span className="footer-desktop-brand__vline" aria-hidden="true" />
              <p className="footer-desktop-brand__mission">
                We believe in positive change, inclusive communities, and empowering people to build a
                better future together.
              </p>
            </div>
          </div>

          <aside className="footer-desktop-hero__aside">
            <a
              className="footer-desktop-whatsapp-btn"
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden stroke={1.75} />
              Join WhatsApp Group
            </a>

            <div className="footer-desktop-follow">
              <p className="footer-desktop-follow__title">Follow Us</p>
              <div className="footer-desktop-social">
                {socialLinks.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon aria-hidden stroke={1.75} />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="footer-desktop-nav">
          <section className="footer-desktop-nav__quick" aria-label="Quick links">
            <h3 className="footer-desktop-section-title">Quick Links</h3>
            <div className="footer-desktop-quick-grid">
              {footerQuickLinks.map(({ label, to, Icon }) => (
                <FooterDesktopQuickLink key={to} label={label} to={to} Icon={Icon} />
              ))}
            </div>
            <FooterPwaDownloads variant="desktop" />
          </section>

          <span className="footer-desktop-nav__vline" aria-hidden="true" />

          <section className="footer-desktop-nav__contact" id="contact-desktop" aria-label="Contact us">
            <h3 className="footer-desktop-section-title">Contact Us</h3>
            <div className="footer-desktop-contact-grid">
              {desktopContactCards.map((card) => (
                <FooterDesktopContactCard key={card.label} {...card} />
              ))}
            </div>
          </section>
        </div>

        <div
          className="footer-desktop-partner"
          aria-label="Designed and developed by V.O.I.C.E. Venture Studio"
        >
          <p className="footer-desktop-partner__label">Proudly Designed &amp; Developed By</p>

          <span className="footer-desktop-partner__vline" aria-hidden="true" />

          <div className="footer-desktop-partner__brand">
            <img
              className="footer-desktop-partner__logo"
              src={voiceVentureStudioLogo}
              alt=""
              loading="lazy"
            />
            <div className="footer-desktop-partner__brand-text">
              <span className="footer-desktop-partner__name-voice">V.O.I.C.E.</span>
              <span className="footer-desktop-partner__name-studio">VENTURE STUDIO</span>
            </div>
            <p className="footer-desktop-partner__tagline">Digital • Design • Innovation</p>
          </div>

          <span className="footer-desktop-partner__vline" aria-hidden="true" />

          <p className="footer-desktop-partner__blurb">
            <span className="footer-desktop-partner__blurb-line">
              V.O.I.C.E. Venture Studio is a digital solutions partner empowering brands with design,
            </span>
            <span className="footer-desktop-partner__blurb-line">development and innovation.</span>
          </p>
        </div>

        <div className="footer-desktop-bottom">
          <hr className="footer-desktop-divider footer-desktop-bottom__divider" aria-hidden="true" />
          <p className="footer-desktop-copyright">
            <IconShield aria-hidden stroke={1.75} />
            <span>© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</span>
          </p>
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
