import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowRight,
  IconCurrencyEuro,
  IconHandLoveYou,
  IconHeartHandshake,
  IconX,
} from "@tabler/icons-react";
import VolunteerForm from "../volunteer/VolunteerForm";
import { useContentOverrides } from "../../hooks/useCmsPage.js";
import { resolveOverrideText } from "../../i18n/overrideText.js";
import sponsorCommunityImage from "../../assets/Home/get-involved/sponsor-community-partnership.jpg";
import donateCommunityImage from "../../assets/Home/get-involved/donate-community-impact.jpg";
import volunteerCommunityImage from "../../assets/Home/get-involved/volunteer-community-welcome-v-logo-indian-student.jpg";
import "../../styles/get-involved-section.css";
import "../../styles/volunteer-page.css";

const linkCards = [
  {
    overrideKey: "involved1",
    i18nKey: "sponsorUs",
    titleEn: "Sponsor Us",
    descriptionEn: "Partner with us and create lasting impact together.",
    to: "/sponsorship",
    accent: "magenta",
    Icon: IconHeartHandshake,
    image: sponsorCommunityImage,
  },
  {
    overrideKey: "involved2",
    i18nKey: "donateNow",
    titleEn: "Donate Now",
    descriptionEn: "Your support helps us create meaningful change.",
    to: "/donate",
    accent: "gold",
    Icon: IconCurrencyEuro,
    image: donateCommunityImage,
  },
];

const volunteerCard = {
  overrideKey: "involved3",
  i18nKey: "volunteer",
  titleEn: "Volunteer",
  descriptionEn: "Give your time and make a real difference.",
  accent: "blue",
  Icon: IconHandLoveYou,
  image: volunteerCommunityImage,
};

export default function GetInvolvedSection() {
  const { t } = useTranslation(["home"]);
  const overrides = useContentOverrides();
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
          {linkCards.map(({ overrideKey, i18nKey, titleEn, descriptionEn, to, accent, Icon, image }) => (
            <Link
              key={i18nKey}
              className={`get-involved-card get-involved-card--with-image get-involved-card--${accent} cta-pulse`}
              to={overrides[`${overrideKey}Link`] || to}
              style={{ "--get-involved-image": `url(${image})` }}
            >
              <div className="get-involved-card__icon">
                <Icon className="get-involved-card__icon-svg" aria-hidden stroke={1.75} />
              </div>
              <div className="get-involved-card__body">
                <h3 className="get-involved-card__title">
                  {resolveOverrideText(overrides[`${overrideKey}Title`], titleEn, t(`home:getInvolved.${i18nKey}.title`))}
                </h3>
                <p className="get-involved-card__description">
                  {resolveOverrideText(overrides[`${overrideKey}Description`], descriptionEn, t(`home:getInvolved.${i18nKey}.description`))}
                </p>
                <span className="get-involved-card__arrow" aria-hidden="true">
                  <IconArrowRight stroke={1.75} />
                </span>
              </div>
            </Link>
          ))}

          <button
            type="button"
            className={`get-involved-card get-involved-card--with-image get-involved-card--${volunteerCard.accent} cta-pulse`}
            onClick={openModal}
            aria-haspopup="dialog"
            style={{ "--get-involved-image": `url(${volunteerCard.image})` }}
          >
            <div className="get-involved-card__icon">
              <IconHandLoveYou className="get-involved-card__icon-svg" aria-hidden stroke={1.75} />
            </div>
            <div className="get-involved-card__body">
              <h3 className="get-involved-card__title">
                {resolveOverrideText(
                  overrides[`${volunteerCard.overrideKey}Title`],
                  volunteerCard.titleEn,
                  t(`home:getInvolved.${volunteerCard.i18nKey}.title`)
                )}
              </h3>
              <p className="get-involved-card__description">
                {resolveOverrideText(
                  overrides[`${volunteerCard.overrideKey}Description`],
                  volunteerCard.descriptionEn,
                  t(`home:getInvolved.${volunteerCard.i18nKey}.description`)
                )}
              </p>
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
              {t("home:getInvolved.volunteerFormTitle")}
            </h2>
            <VolunteerForm />
          </div>
        </div>
      )}
    </section>
  );
}
