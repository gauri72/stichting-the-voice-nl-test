import { IconArrowRight, IconGift, IconHeartHandshake, IconUsersGroup } from "@tabler/icons-react";
import { DONATION_OTHER_WAYS } from "../../data/donateTiersDisplay.js";
import "../../styles/donate-other-ways-section.css";

const OTHER_WAY_ICONS = {
  handshake: IconHeartHandshake,
  gift: IconGift,
  volunteer: IconUsersGroup,
};

export default function DonateOtherWaysSection() {
  return (
    <section
      id="donate-other-ways"
      className="donate-other-ways-section"
      aria-labelledby="donate-other-ways-title"
    >
      <div className="donate-other-ways-section__inner">
        <h2 id="donate-other-ways-title" className="donate-other-ways-section__title">
          Other Ways to Give
        </h2>

        <div className="donate-other-ways-section__grid" role="list">
          {DONATION_OTHER_WAYS.map(({ title, text, icon, href }) => {
            const Icon = OTHER_WAY_ICONS[icon] || IconGift;

            return (
              <article key={title} className="donate-other-ways-section__card" role="listitem">
                <span className="donate-other-ways-section__icon-wrap" aria-hidden="true">
                  <Icon className="donate-other-ways-section__icon" stroke={1.5} />
                </span>
                <div className="donate-other-ways-section__body">
                  <h3 className="donate-other-ways-section__card-title">{title}</h3>
                  <p className="donate-other-ways-section__card-text">{text}</p>
                  <a className="donate-other-ways-section__link" href={href}>
                    Learn More
                    <IconArrowRight size={16} stroke={2} aria-hidden />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
