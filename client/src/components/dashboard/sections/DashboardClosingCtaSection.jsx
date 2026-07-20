import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import ctaLogo from "../../../assets/Dashboard/logo.png";
import { DASHBOARD_ROUTES } from "../dashboardUtils.js";
import "../../../styles/dashboard-closing-cta-section.css";

export default function DashboardClosingCtaSection() {
  const { t } = useTranslation(["dashboardSections"]);
  return (
    <section className="dash-cta" aria-labelledby="dash-cta-title">
      <div className="dash-cta__content">
        <img className="dash-cta__logo logo-glow" src={ctaLogo} alt="" decoding="async" />

        <div className="dash-cta__copy">
          <h2 id="dash-cta-title" className="dash-cta__title">
            <span className="dash-cta__title-row">{t("dashboardSections:closingCtaSection.titleLine1")}</span>
            <span className="dash-cta__title-row dash-cta__title-row--accent dash-grad-text">
              {t("dashboardSections:closingCtaSection.titleLine2")}
            </span>
          </h2>
          <p className="dash-cta__text">
            {t("dashboardSections:closingCtaSection.text")}
          </p>
        </div>

        <Link to={DASHBOARD_ROUTES.profile} className="dash-cta__btn dash-cta__btn--profile">
          {t("dashboardSections:closingCtaSection.myProfile")} <FaArrowRight aria-hidden />
        </Link>
        <Link to={DASHBOARD_ROUTES.events} className="dash-cta__btn dash-cta__btn--discover">
          {t("dashboardSections:closingCtaSection.discoverMore")} <FaArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
