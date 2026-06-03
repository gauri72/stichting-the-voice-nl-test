import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconBulb,
  IconHeartHandshake,
  IconMicrophone,
  IconPresentation,
} from "@tabler/icons-react";
import { TABLER_ICON_STROKE } from "../../constants/homeIcons.js";
import "../../styles/our-pillars-section.css";

const ArrowIcon = IconArrowRight;

const pillars = [
  {
    mobileTitle: "Experience",
    desktopTitle: "V.O.I.C.E. Experience",
    desktopLead: "Creating unforgettable cultural experiences.",
    desktopTags: "Events • Festivals • Music • Dance • Sports",
    to: "/events",
    accent: "teal",
    Icon: IconPresentation,
  },
  {
    mobileTitle: "Stories",
    desktopTitle: "V.O.I.C.E. Stories",
    desktopLead: "Sharing voices through Vision Of Sounds.",
    desktopTags: "Podcast • Voice Of Visionaries • Media • Photography • Interviews",
    to: "/segments/vision-of-sounds",
    accent: "magenta",
    Icon: IconMicrophone,
  },
  {
    mobileTitle: "Impact",
    desktopTitle: "V.O.I.C.E. Impact",
    desktopLead: "VOWNL • Social Work • Empowering communities through action.",
    desktopTags: "Youth • Inclusion • Education • Volunteering",
    to: "/segments/vownl",
    accent: "gold",
    Icon: IconHeartHandshake,
  },
  {
    mobileTitle: "Innovation",
    desktopTitle: "V.O.I.C.E. Innovation",
    desktopLead: "Building the future through technology.",
    desktopTags: "V.O.I.C.E. Digital • Apps • Websites • V.O.I.C.E. Venture Studio",
    to: "/voice-venture-studio",
    accent: "blue",
    Icon: IconBulb,
  },
];

export default function OurPillarsSection() {
  return (
    <section className="our-pillars-section" aria-labelledby="our-pillars-title">
      <div className="our-pillars-section__inner">
        <div className="our-pillars-section__heading">
          <span className="our-pillars-section__heading-line" aria-hidden="true" />
          <h2 id="our-pillars-title" className="our-pillars-section__title">
            Four Pillars. One Mission.
          </h2>
          <span className="our-pillars-section__heading-line" aria-hidden="true" />
        </div>

        <div className="our-pillars-grid" role="list">
          {pillars.map(
            (
              { mobileTitle, desktopTitle, desktopLead, desktopTags, to, accent, Icon },
              index
            ) => (
              <article
                key={mobileTitle}
                className={`our-pillars-item our-pillars-item--${accent}${
                  index < pillars.length - 1 ? " our-pillars-item--divided" : ""
                }`}
                role="listitem"
              >
                <div className="our-pillars-item__icon" aria-hidden="true">
                  <Icon className="our-pillars-item__icon-svg" stroke={TABLER_ICON_STROKE} />
                </div>

                <h3 className="our-pillars-item__title our-pillars-item__title--mobile">
                  {mobileTitle}
                </h3>
                <h3 className="our-pillars-item__title our-pillars-item__title--desktop">
                  {desktopTitle}
                </h3>

                <div className="our-pillars-item__description">
                  <p className="our-pillars-item__lead">{desktopLead}</p>
                  <p className="our-pillars-item__tags">{desktopTags}</p>
                </div>

                <Link className="our-pillars-item__link" to={to}>
                  Learn more
                  <ArrowIcon aria-hidden stroke={TABLER_ICON_STROKE} />
                </Link>
              </article>
            )
          )}
        </div>
      </div>
    </section>
  );
}
