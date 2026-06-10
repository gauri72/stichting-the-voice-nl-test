import { Link } from "react-router-dom";
import { IconArrowRight, IconMicrophone, IconMusic } from "@tabler/icons-react";
import { STORIES_HERO } from "../../data/storiesDisplay.js";

const ICON_MAP = {
  music: IconMusic,
  microphone: IconMicrophone,
};

export default function StoriesHeroSection() {
  const { titleLead, titleAccent, description, imageLight, imageDark, quickLinks } = STORIES_HERO;

  return (
    <section className="stories-hero" aria-labelledby="stories-hero-title">
      <div className="stories-hero__copy">
        <h1 id="stories-hero-title" className="stories-hero__title">
          {titleLead} <span className="stories-accent--blue">{titleAccent}</span>
        </h1>
        <p className="stories-hero__description">{description}</p>

        <div className="stories-hero__links">
          {quickLinks.map(({ key, icon, logo, title, subtitle, accent, to }) => {
            const Icon = ICON_MAP[icon] || IconMusic;

            return (
              <Link
                key={key}
                to={to}
                className={`stories-hero__link stories-hero__link--${accent}`}
              >
                <span
                  className={`stories-hero__link-icon${
                    logo ? " stories-hero__link-icon--logo" : ""
                  }`}
                  aria-hidden="true"
                >
                  {logo ? (
                    <img src={logo} alt="" />
                  ) : (
                    <Icon size={22} stroke={1.8} />
                  )}
                </span>
                <span className="stories-hero__link-text">
                  <span className="stories-hero__link-title">{title}</span>
                  <span className="stories-hero__link-subtitle">{subtitle}</span>
                </span>
                <IconArrowRight className="stories-hero__link-arrow" size={18} stroke={2} aria-hidden />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="stories-hero__media">
        <img
          className="stories-hero__image stories-hero__image--light"
          src={imageLight}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
        <img
          className="stories-hero__image stories-hero__image--dark"
          src={imageDark}
          alt=""
          decoding="async"
        />
      </div>
    </section>
  );
}
