import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconCurrencyEuro,
  IconHandLoveYou,
  IconHeartHandshake,
  IconUsersGroup,
  IconX,
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

  function openModal() {
    setVolunteerFormOpen(true);
  }

  function closeModal() {
    setVolunteerFormOpen(false);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") closeModal();
    }
    if (volunteerFormOpen) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
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
            className={`get-involved-card get-involved-card--${volunteerCard.accent}`}
            onClick={openModal}
            aria-haspopup="dialog"
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
      </div>

      {volunteerFormOpen && (
        <div
          className="volunteer-modal-backdrop"
          onClick={handleBackdropClick}
          role="presentation"
        >
          <div
            className="volunteer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="volunteer-modal-title"
          >
            <button
              className="volunteer-modal__close"
              onClick={closeModal}
              aria-label="Close volunteer form"
            >
              <IconX size={20} stroke={2} />
            </button>
            <h2 id="volunteer-modal-title" className="volunteer-modal__title">
              Fill This Form to Volunteer
            </h2>
            <VolunteerForm />
          </div>
        </div>
      )}
    </section>
  );
}
