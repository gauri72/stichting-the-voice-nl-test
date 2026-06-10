import {
  IconBulb,
  IconChartBar,
  IconUsersGroup,
  IconWorld,
} from "@tabler/icons-react";
import { INNOVATION_DIGITAL } from "../../data/innovationDisplay.js";

const PILLAR_ICONS = {
  globe: IconWorld,
  chart: IconChartBar,
  people: IconUsersGroup,
  bulb: IconBulb,
};

export default function InnovationDigitalSection() {
  const { brandMark, brandName, title, description, pillars } = INNOVATION_DIGITAL;

  return (
    <section className="innovation-digital" aria-labelledby="innovation-digital-title">
      <div className="innovation-digital__card">
        <div className="innovation-digital__top">
          <div className="innovation-digital__brand">
            <span className="innovation-digital__brand-mark">{brandMark}</span>
            <span className="innovation-digital__brand-name">{brandName}</span>
          </div>

          <div className="innovation-digital__divider" aria-hidden="true" />

          <div className="innovation-digital__intro">
            <h2 id="innovation-digital-title" className="innovation-digital__title">
              {title}
            </h2>
            <p className="innovation-digital__description">{description}</p>
          </div>
        </div>

        <div className="innovation-digital__pillars" role="list">
          {pillars.map(({ key, icon, label }) => {
            const Icon = PILLAR_ICONS[icon] || IconBulb;

            return (
              <div key={key} className="innovation-digital__pillar" role="listitem">
                <span className="innovation-digital__pillar-icon" aria-hidden="true">
                  <Icon size={28} stroke={1.5} />
                </span>
                <p className="innovation-digital__pillar-label">{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
