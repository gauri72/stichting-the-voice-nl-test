import {
  IconChartLine,
  IconHeartHandshake,
  IconSpeakerphone,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { SPONSORSHIP_WHY_REASONS } from "../../data/sponsorshipTiersDisplay.js";
import "../../styles/sponsorship-why-section.css";

const REASON_ICONS = {
  users: IconUsers,
  globe: IconWorld,
  bullhorn: IconSpeakerphone,
  handshake: IconHeartHandshake,
  chart: IconChartLine,
};

export default function SponsorshipWhySection() {
  return (
    <section
      id="sponsorship-why"
      className="sponsorship-why-section"
      aria-labelledby="sponsorship-why-title"
    >
      <div className="sponsorship-why-section__inner">
        <h2 id="sponsorship-why-title" className="sponsorship-why-section__title">
          Why Sponsor Stichting The V.O.I.C.E. NL?
        </h2>

        <div className="sponsorship-why-section__grid" role="list" aria-label="Reasons to sponsor">
          {SPONSORSHIP_WHY_REASONS.map(({ title, text, icon }) => {
            const Icon = REASON_ICONS[icon] || IconUsers;

            return (
              <article key={title} className="sponsorship-why-section__item" role="listitem">
                <span className="sponsorship-why-section__icon-wrap" aria-hidden="true">
                  <Icon className="sponsorship-why-section__icon" stroke={1.5} />
                </span>
                <h3 className="sponsorship-why-section__item-title">{title}</h3>
                <p className="sponsorship-why-section__item-text">{text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
