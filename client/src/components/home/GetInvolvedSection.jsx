import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconCurrencyEuro,
  IconHandLoveYou,
  IconHeartHandshake,
  IconUsersGroup,
} from "@tabler/icons-react";
import VolunteerForm from "../volunteer/VolunteerForm";
import "../../styles/get-involved-section.css";
import "../../styles/volunteer-page.css";

const linkCards = [
  {
    title: "Become A Member",
    description: "Join our community and be part of the movement.",
    to: "/membership",
    accent: "teal",
    Icon: IconUsersGroup,
  },
  {
    title: "Sponsor Us",
    description: "Partner with us and create lasting impact together.",
    to: "/sponsorship",
    accent: "magenta",
    Icon: IconHeartHandshake,
  },
  {
    title: "Donate Now",
    description: "Your support helps us create meaningful change.",
    to: "/donate",
    accent: "gold",
    Icon: IconCurrencyEuro,
  },
];

const volunteerCard = {
  title: "Volunteer",
  description: "Give your time and make a real difference.",
  accent: "blue",
  Icon: IconHandLoveYou,
};

export default function GetInvolvedSection() {
  const [volunteerFormOpen, setVolunteerFormOpen] = useState(false);
  const volunteerPanelRef = useRef(null);

  useEffect(() => {
    if (!volunteerFormOpen) return;
    requestAnimationFrame(() => {
      volunteerPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [volunteerFormOpen]);

  return (
    <section className="get-involved-section" aria-label="Get involved">
      <div className="get-involved-section__inner">
        <div className="get-involved-grid">
          {linkCards.map(({ title, description, to, accent, Icon }) => (
            <Link
              key={title}
              className={`get-involved-card get-involved-card--${accent}`}
              to={to}
            >
              <div className="get-involved-card__icon">
                <Icon className="get-involved-card__icon-svg" aria-hidden stroke={1.75} />
              </div>
              <div className="get-involved-card__body">
                <h3 className="get-involved-card__title">{title}</h3>
                <p className="get-involved-card__description">{description}</p>
                <span className="get-involved-card__arrow" aria-hidden="true">
                  <IconArrowRight stroke={1.75} />
                </span>
              </div>
            </Link>
          ))}

          <button
            type="button"
            className={`get-involved-card get-involved-card--${volunteerCard.accent}${
              volunteerFormOpen ? " get-involved-card--active" : ""
            }`}
            onClick={() => setVolunteerFormOpen((open) => !open)}
            aria-expanded={volunteerFormOpen}
            aria-controls="volunteer-form-panel"
          >
            <div className="get-involved-card__icon">
              <IconHandLoveYou className="get-involved-card__icon-svg" aria-hidden stroke={1.75} />
            </div>
            <div className="get-involved-card__body">
              <h3 className="get-involved-card__title">{volunteerCard.title}</h3>
              <p className="get-involved-card__description">{volunteerCard.description}</p>
              <span className="get-involved-card__arrow" aria-hidden="true">
                <IconArrowRight stroke={1.75} />
              </span>
            </div>
          </button>
        </div>

        {volunteerFormOpen ? (
          <div
            id="volunteer-form-panel"
            ref={volunteerPanelRef}
            className="get-involved-volunteer-panel"
          >
            <h2 className="get-involved-volunteer-panel__title">Fill This Form to Volunteer</h2>
            <VolunteerForm />
          </div>
        ) : null}
      </div>
    </section>
  );
}
