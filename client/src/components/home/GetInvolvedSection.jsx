import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { TbUsersGroup, TbHeartHandshake } from "react-icons/tb";
import { BiDonateHeart } from "react-icons/bi";
import { MdVolunteerActivism } from "react-icons/md";
import VolunteerForm from "../volunteer/VolunteerForm";
import "../../styles/get-involved-section.css";
import "../../styles/volunteer-page.css";

const linkCards = [
  {
    title: "Become A Member",
    description: "Join our community and be part of the movement.",
    to: "/membership",
    accent: "teal",
    Icon: TbUsersGroup,
  },
  {
    title: "Sponsor Us",
    description: "Partner with us and create lasting impact together.",
    to: "/sponsorship",
    accent: "magenta",
    Icon: TbHeartHandshake,
  },
  {
    title: "Donate Now",
    description: "Your support helps us create meaningful change.",
    to: "/donate",
    accent: "gold",
    Icon: BiDonateHeart,
  },
];

const volunteerCard = {
  title: "Volunteer",
  description: "Give your time and make a real difference.",
  accent: "blue",
  Icon: MdVolunteerActivism,
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
                <Icon className="get-involved-card__icon-svg" aria-hidden />
              </div>
              <div className="get-involved-card__body">
                <h3 className="get-involved-card__title">{title}</h3>
                <p className="get-involved-card__description">{description}</p>
                <span className="get-involved-card__arrow" aria-hidden="true">
                  <IoArrowForward />
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
              <volunteerCard.Icon className="get-involved-card__icon-svg" aria-hidden />
            </div>
            <div className="get-involved-card__body">
              <h3 className="get-involved-card__title">{volunteerCard.title}</h3>
              <p className="get-involved-card__description">{volunteerCard.description}</p>
              <span className="get-involved-card__arrow" aria-hidden="true">
                <IoArrowForward />
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
