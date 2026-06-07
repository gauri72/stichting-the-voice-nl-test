import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import ctaBgLight from "../../../assets/Dashboard/cta-bg-light.png";
import ctaBgDark from "../../../assets/Dashboard/cta-bg-dark.png";
import "../../../styles/dashboard-closing-cta-section.css";

export default function DashboardClosingCtaSection() {
  return (
    <section className="dash-cta" aria-labelledby="dash-cta-title">
      <div className="dash-cta__bg" aria-hidden>
        <img
          className="dash-cta__bg-image dash-cta__bg-image--light"
          src={ctaBgLight}
          alt=""
          decoding="async"
        />
        <img
          className="dash-cta__bg-image dash-cta__bg-image--dark"
          src={ctaBgDark}
          alt=""
          decoding="async"
        />
      </div>

      <div className="dash-cta__content">
        <div className="dash-cta__copy">
          <h2 id="dash-cta-title" className="dash-cta__title">
            Thank You For Being <span className="dash-grad-text">Part Of The Movement</span>
          </h2>
          <p className="dash-cta__text">
            Together we create Experiences. Share Stories. Drive Impact. Spark Innovation.
          </p>
        </div>
        <Link to="/my-account" className="dash-cta__btn">
          My Profile <FaArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
