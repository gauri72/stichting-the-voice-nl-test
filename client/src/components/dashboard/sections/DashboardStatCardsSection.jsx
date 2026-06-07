import { FaRegCheckCircle } from "react-icons/fa";
import {
  IconCalendarEvent,
  IconHeartHandshake,
  IconShieldCheck,
  IconUsersGroup,
} from "@tabler/icons-react";
import { planTierLabel } from "../dashboardUtils.js";
import "../../../styles/dashboard-stat-cards-section.css";

export default function DashboardStatCardsSection({ overview, hasMembership, planId }) {
  const tier = planTierLabel(planId);

  const cards = [
    {
      id: "membership",
      icon: <IconShieldCheck size={28} stroke={1.75} />,
      label: ["Active", "Membership"],
      value: hasMembership ? tier : "—",
      tone: "green",
      showCheck: hasMembership,
    },
    {
      id: "events",
      icon: <IconCalendarEvent size={28} stroke={1.75} />,
      label: ["Events", "Attended"],
      value: overview?.events?.value ?? "0",
      tone: "teal",
    },
    {
      id: "donations",
      icon: <IconHeartHandshake size={28} stroke={1.75} />,
      label: ["Donations", "Made"],
      value: overview?.donations?.value ?? "€0",
      tone: "green",
    },
    {
      id: "sponsorships",
      icon: <IconUsersGroup size={28} stroke={1.75} />,
      label: ["Sponsorships", ""],
      value: `${overview?.sponsorships?.count ?? 0} Active`,
      tone: "blue",
    },
  ];

  return (
    <section className="dash-stats-section" aria-labelledby="dash-impact-title">
      <h2 id="dash-impact-title" className="dash-stats-section__title">
        Your V.O.I.C.E. NL Impact
      </h2>
      <div className="dash-stats">
        {cards.map((card) => (
          <article key={card.id} className={`dash-stat dash-stat--${card.tone}`}>
            <span className={`dash-stat__icon dash-stat__icon--${card.tone}`} aria-hidden>
              {card.icon}
            </span>
            <p className="dash-stat__label">
              {card.label[0]}
              {card.label[1] ? (
                <>
                  <br />
                  {card.label[1]}
                </>
              ) : null}
            </p>
            <p className={`dash-stat__value dash-stat__value--${card.tone}`}>{card.value}</p>
            {card.showCheck ? (
              <FaRegCheckCircle className="dash-stat__check" aria-hidden />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
