import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import ctaLogo from "../../../assets/Dashboard/logo.png";
import { DASHBOARD_ROUTES } from "../dashboardUtils.js";
import "../../../styles/dashboard-closing-cta-section.css";

export default function DashboardClosingCtaSection() {
  return (
    <section className="dash-cta" aria-labelledby="dash-cta-title">
      <div className="dash-cta__content">
        <img className="dash-cta__logo logo-glow" src={ctaLogo} alt="" decoding="async" />

        <div className="dash-cta__copy">
          <h2 id="dash-cta-title" className="dash-cta__title">
            <span className="dash-cta__title-row">Thank You For Being</span>
            <span className="dash-cta__title-row dash-cta__title-row--accent dash-grad-text">
              Part Of The Movement
            </span>
          </h2>
          <p className="dash-cta__text">
            Together we create Experiences. Share Stories. Drive Impact. Spark Innovation.
          </p>
        </div>

        <Link to={DASHBOARD_ROUTES.profile} className="dash-cta__btn dash-cta__btn--profile">
          My Profile <FaArrowRight aria-hidden />
        </Link>
        <Link to={DASHBOARD_ROUTES.events} className="dash-cta__btn dash-cta__btn--discover">
          Discover More <FaArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
