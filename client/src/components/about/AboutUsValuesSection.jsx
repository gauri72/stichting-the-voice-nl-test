import {
  IconBulb,
  IconHeartHandshake,
  IconShieldCheck,
  IconUsersGroup,
  IconWorld,
} from "@tabler/icons-react";
import { ABOUT_VALUES } from "../../data/aboutUsDisplay.js";

const VALUE_ICONS = {
  Inclusion: IconUsersGroup,
  Integrity: IconShieldCheck,
  Innovation: IconBulb,
  Collaboration: IconHeartHandshake,
  Impact: IconWorld,
};

export default function AboutUsValuesSection() {
  return (
    <section className="about-us-values-section" aria-labelledby="about-us-values-title">
      <div className="about-us-values-section__inner">
        <h2 id="about-us-values-title" className="about-us-section-title">
          Our Values
        </h2>
        <div className="about-us-values-section__grid" role="list">
          {ABOUT_VALUES.map(({ title, description }) => {
            const Icon = VALUE_ICONS[title] || IconHeartHandshake;

            return (
              <div key={title} className="about-us-values-section__item" role="listitem">
                <span className="about-us-values-section__icon-wrap" aria-hidden="true">
                  <Icon className="about-us-values-section__icon" stroke={1.5} />
                </span>
                <h3 className="about-us-values-section__item-title">{title}</h3>
                <p className="about-us-values-section__item-text">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
