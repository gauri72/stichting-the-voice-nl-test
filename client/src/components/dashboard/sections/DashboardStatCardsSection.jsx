import { Link } from "react-router-dom";
import { FaRegCheckCircle } from "react-icons/fa";
import {
  IconCalendarEvent,
  IconHeartHandshake,
  IconShieldCheck,
  IconUsersGroup,
} from "@tabler/icons-react";
import {
  planTierLabel,
  scrollToId,
  DASHBOARD_MEMBERSHIP_CARD_ID,
  DASHBOARD_ROUTES,
} from "../dashboardUtils.js";
import DashboardVCommerceHighlights from "./DashboardVCommerceHighlights.jsx";
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
      to: `#${DASHBOARD_MEMBERSHIP_CARD_ID}`,
    },
    {
      id: "events",
      icon: <IconCalendarEvent size={28} stroke={1.75} />,
      label: ["Events", "Attended"],
      value: overview?.events?.value ?? "0",
      tone: "teal",
      to: DASHBOARD_ROUTES.myEvents,
    },
    {
      id: "donations",
      icon: <IconHeartHandshake size={28} stroke={1.75} />,
      label: ["Donations", "Made"],
      value: overview?.donations?.value ?? "€0",
      tone: "green",
      to: DASHBOARD_ROUTES.donationsHistory,
    },
    {
      id: "sponsorships",
      icon: <IconUsersGroup size={28} stroke={1.75} />,
      label: ["Sponsorships", ""],
      value: `${overview?.sponsorships?.count ?? 0} Active`,
      tone: "blue",
      to: DASHBOARD_ROUTES.sponsorshipsHistory,
    },
  ];

  return (
    <>
      <DashboardVCommerceHighlights />
      <section className="dash-stats-section" aria-labelledby="dash-impact-title">
        <h2 id="dash-impact-title" className="dash-stats-section__title">
          Your V.O.I.C.E. NL Impact
        </h2>
        <div className="dash-stats">
        {cards.map((card) => {
          const isAnchor = card.to.startsWith("#");
          const content = (
            <>
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
            </>
          );

          return isAnchor ? (
            <button
              key={card.id}
              type="button"
              className={`dash-stat dash-stat--${card.tone} dash-stat--clickable`}
              onClick={() => scrollToId(card.to)}
            >
              {content}
            </button>
          ) : (
            <Link key={card.id} to={card.to} className={`dash-stat dash-stat--${card.tone} dash-stat--clickable`}>
              {content}
            </Link>
          );
        })}
        </div>
      </section>
    </>
  );
}
