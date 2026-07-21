import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { WHATSAPP_GROUP_URL, buildWhatsAppHref } from "../../constants/siteLinks.js";
import { useCmsFooter } from "../../hooks/useCmsPage.js";
import { useCookieConsent } from "../../contexts/CookieConsentContext.jsx";
import { translateKnownLabel, translateKnownNavLabel } from "../../i18n/navLabels.js";
import footerBg from "../../assets/footer-bg.png";
import voiceNlLogo from "../../assets/logos/V.O.I.C.E. NL Copyright HD Logo.png";
import voiceVentureStudioLogo from "../../assets/VOICE Venture Studio.png";
import FooterPwaDownloads from "./FooterPwaDownloads.jsx";
import "../../styles/footer.css";
import "../../styles/footer-mobile.css";
import "../../styles/footer-desktop.css";
import "../../styles/footer-pwa-downloads.css";

function buildFooterQuickLinks(t) {
  return [
    { label: t("common:footer.quickLinks.home"), to: "/", Icon: IconHome },
    { label: t("common:footer.quickLinks.experience"), to: "/events", Icon: IconSparkles },
    { label: t("common:footer.quickLinks.becomeMember"), to: "/membership", Icon: IconCrown },
    { label: t("common:footer.quickLinks.sponsorUs"), to: "/sponsorship", Icon: IconHeartHandshake },
    { label: t("common:footer.quickLinks.donate"), to: "/donate", Icon: IconGift },
    { label: t("common:footer.quickLinks.stories"), to: "/stories", Icon: IconMicrophone },
    { label: t("common:footer.quickLinks.impact"), to: "/impact", Icon: IconHeartHandshake },
    { label: t("common:footer.quickLinks.innovation"), to: "/voice-venture-studio", Icon: IconBulb },
    { label: t("common:footer.quickLinks.aboutUs"), to: "/about-us", Icon: IconUsers },
    { label: t("common:footer.quickLinks.policies"), to: "/privacy-policy", Icon: IconShield },
  ];
}

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
  const { t } = useTranslation(["common", "cookies"]);
  const { openPreferences } = useCookieConsent();
  const { footer: cmsFooter } = useCmsFooter();
  const cmsContent = cmsFooter?.content || {};
  const cmsContact = cmsFooter?.contactDetails || {};
  const cmsQuickLinks = (cmsFooter?.quickLinks || []).filter((l) => l.visible !== false);
  const cmsSocialLinks = (cmsFooter?.socialLinks || []).filter((l) => l.visible !== false);

  const [contactEmail, setContactEmail] = useState(cmsContact.email || DEFAULT_CONTACT_EMAIL);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const heroHeading = translateKnownLabel(cmsContent.heroHeading, t) || t("common:footer.heroHeading");
  const heroSubheading = translateKnownLabel(cmsContent.heroSubheading, t) || t("common:footer.heroSubheading");
  const missionText = translateKnownLabel(cmsContent.missionText, t) || t("common:footer.missionText");
  const copyrightText = translateKnownLabel(cmsContent.copyrightText, t) || t("common:footer.copyrightText");
  const whatsappText = translateKnownLabel(cmsContent.whatsappButtonText, t) || t("common:footer.whatsappButton");
  const whatsappUrl = cmsContent.whatsappButtonUrl || WHATSAPP_GROUP_URL;
  const footerBgImage = cmsContent.backgroundImage?.url || footerBg;
  const footerLogo = cmsContent.logo?.url || voiceNlLogo;

  const footerQuickLinks = buildFooterQuickLinks(t);
  const activeQuickLinks = cmsQuickLinks.length
    ? cmsQuickLinks
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((link) => {
          const fallback = footerQuickLinks.find((f) => f.to === link.url);
          return {
            label: translateKnownNavLabel(link.url, link.label, t),
            to: link.url,
            Icon: fallback?.Icon || IconHome,
          };
        })
    : footerQuickLinks;

  const activeSocialLinks = cmsSocialLinks.length
    ? cmsSocialLinks.map((link) => {
        const fallback = socialLinks.find((s) => s.label === link.platform || s.label === link.label);
        return {
          href: link.url,
          label: link.label || link.platform,
          Icon: fallback?.Icon || IconBrandFacebook,
        };
      })
    : socialLinks;

  useEffect(() => {
    if (cmsContact.email) {
      setContactEmail(cmsContact.email);
      return;
    }
    apiFetch("/api/public/site")
      .then((data) => {
        if (data?.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, [cmsContact.email]);

  const contactCards = [
    {
      label: t("common:footer.contact.kvk"),
      value: cmsContact.kvk || "92180213",
      accent: "blue",
      Icon: IconBuilding,
    },
    {
      label: t("common:footer.contact.address"),
      value: cmsContact.address || t("common:footer.contact.addressValue"),
      accent: "green",
      Icon: IconMapPin,
    },
    {
      label: t("common:footer.contact.email"),
      value: contactEmail,
      href: `mailto:${contactEmail}`,
      accent: "purple",
      Icon: IconMail,
    },
    {
      label: t("common:footer.contact.mobile"),
      value: cmsContact.phone || "+31619032104",
      href: `tel:${(cmsContact.phone || "+31619032104").replace(/\s/g, "")}`,
      accent: "teal",
      Icon: IconPhone,
    },
  ];

  const desktopContactCards = contactCards;

  return (
    <footer className="site-footer site-footer--with-bg" style={{ "--footer-bg-image": `url(${footerBgImage})` }}>
      <div className="footer-mobile">
        <div className="footer-mobile-hero">
          <IconHeart className="footer-mobile-hero__heart" aria-hidden stroke={1.75} />

          <h2 className="footer-mobile-hero__title">{heroHeading}</h2>
          <div className="footer-mobile-hero__subtitle-wrap">
            <p className="footer-mobile-hero__subtitle">
              <span className="footer-mobile-hero__subtitle-blue">{heroSubheading}</span>
            </p>
          </div>

          <FooterMobileDivider />

          <div className="footer-mobile-hero__brand">
            <img
              className="footer-mobile-hero__logo"
              src={footerLogo}
              alt=""
              loading="lazy"
            />
            <p className="footer-mobile-hero__brand-name">V.O.I.C.E. NL</p>
          </div>

          <FooterMobileDivider />

          <a
            className="footer-mobile-whatsapp-btn"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandWhatsapp className="footer-mobile-whatsapp-btn__icon" aria-hidden stroke={1.75} />
            <span>{whatsappText}</span>
          </a>
        </div>

        <section className="footer-mobile-section" aria-label="Follow us">
          <FooterSectionTitle>{t("common:footer.followUs")}</FooterSectionTitle>
          <div className="footer-mobile-social">
            {activeSocialLinks.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Icon aria-hidden stroke={1.75} />
              </a>
            ))}
          </div>
        </section>

        <section className="footer-mobile-section" aria-label="Quick links">
          <FooterSectionTitle>{t("common:footer.quickLinksTitle")}</FooterSectionTitle>
          <div className="footer-mobile-quick-grid">
            {activeQuickLinks.map(({ label, to, Icon }) => (
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
          <FooterSectionTitle>{t("common:footer.contactUs")}</FooterSectionTitle>
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
            <span>{t("common:footer.designedBy")}</span>
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
              <p className="footer-mobile-credit__tagline">{t("common:footer.studioTagline")}</p>
            </div>
          </div>
        </div>

        <p className="footer-mobile-copyright">
          <IconShield aria-hidden stroke={1.75} />
          <span>{copyrightText}</span>
        </p>
        <button type="button" className="footer-cookie-settings" onClick={openPreferences}>
          {t("cookies:footer.cookieSettings")}
        </button>
      </div>

      <div className="footer-desktop">
        <div className="footer-desktop-hero">
          <div className="footer-desktop-hero__main">
            <div className="footer-desktop-hero__headline">
              <h2 className="footer-desktop-hero__title">{heroHeading}</h2>
              <p className="footer-desktop-hero__subtitle">
                <span className="footer-desktop-hero__subtitle-blue">{heroSubheading}</span>
              </p>
            </div>

            <div className="footer-desktop-brand">
              <img
                className="footer-desktop-brand__logo"
                src={footerLogo}
                alt=""
                loading="lazy"
              />
              <div className="footer-desktop-brand__identity">
                <p className="footer-desktop-brand__name">V.O.I.C.E. NL</p>
              </div>
              <span className="footer-desktop-brand__vline" aria-hidden="true" />
              <p className="footer-desktop-brand__mission">{missionText}</p>
            </div>
          </div>

          <aside className="footer-desktop-hero__aside">
            <a
              className="footer-desktop-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandWhatsapp aria-hidden stroke={1.75} />
              {whatsappText}
            </a>

            <div className="footer-desktop-follow">
              <p className="footer-desktop-follow__title">{t("common:footer.followUs")}</p>
              <div className="footer-desktop-social">
                {activeSocialLinks.map(({ href, label, Icon }) => (
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
            <h3 className="footer-desktop-section-title">{t("common:footer.quickLinksTitle")}</h3>
            <div className="footer-desktop-quick-grid">
              {activeQuickLinks.map(({ label, to, Icon }) => (
                <FooterDesktopQuickLink key={to} label={label} to={to} Icon={Icon} />
              ))}
            </div>
            <FooterPwaDownloads variant="desktop" />
          </section>

          <span className="footer-desktop-nav__vline" aria-hidden="true" />

          <section className="footer-desktop-nav__contact" id="contact-desktop" aria-label="Contact us">
            <h3 className="footer-desktop-section-title">{t("common:footer.contactUs")}</h3>
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
          <p className="footer-desktop-partner__label">{t("common:footer.designedBy")}</p>

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
            <p className="footer-desktop-partner__tagline">{t("common:footer.studioTagline")}</p>
          </div>

          <span className="footer-desktop-partner__vline" aria-hidden="true" />

          <p className="footer-desktop-partner__blurb">
            <span className="footer-desktop-partner__blurb-line">
              {t("common:footer.studioBlurbLine1")}
            </span>
            <span className="footer-desktop-partner__blurb-line">{t("common:footer.studioBlurbLine2")}</span>
          </p>
        </div>

        <div className="footer-desktop-bottom">
          <hr className="footer-desktop-divider footer-desktop-bottom__divider" aria-hidden="true" />
          <p className="footer-desktop-copyright">
            <IconShield aria-hidden stroke={1.75} />
            <span>{copyrightText}</span>
          </p>
          <button type="button" className="footer-cookie-settings" onClick={openPreferences}>
            {t("cookies:footer.cookieSettings")}
          </button>
        </div>
      </div>

      {isChatOpen ? (
        <aside className="footer-whatsapp-widget" aria-label="WhatsApp chat">
          <div className="footer-whatsapp-header">
            <span>
              <IconBrandWhatsapp aria-hidden stroke={1.75} /> {t("common:footer.whatsappWidget.title")}
            </span>
            <button type="button" onClick={() => setIsChatOpen(false)} aria-label="Close WhatsApp chat widget">
              <IconX aria-hidden stroke={1.75} />
            </button>
          </div>

          <div className="footer-whatsapp-body">
            <p>
              {t("common:footer.whatsappWidget.greeting")} <span aria-hidden>👋</span>
              <br />
              {t("common:footer.whatsappWidget.helpQuestion")}
            </p>
          </div>

          <a
            className="footer-whatsapp-open-chat"
            href={buildWhatsAppHref()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open WhatsApp chat"
          >
            {t("common:footer.whatsappWidget.openChat")}
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
