import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHandshake, FaStar } from "react-icons/fa";
import ctaLogo from "../../assets/Dashboard/logo.png";
import "../../styles/login-cta-section.css";

export default function LoginCtaSection() {
  const { t } = useTranslation(["auth"]);

  return (
    <section className="login-cta-section" aria-labelledby="login-cta-title">
      <div className="login-cta-section__inner">
        <div className="login-cta">
          <img className="login-cta__logo logo-glow" src={ctaLogo} alt="" decoding="async" />

          <div className="login-cta__copy">
            <h2 id="login-cta-title" className="login-cta__title">
              <span className="login-cta__title-row">{t("auth:cta.titleRow1")}</span>
              <span className="login-cta__title-row login-cta__title-row--accent login-grad-text">
                {t("auth:cta.titleRow2")}
              </span>
            </h2>
            <p className="login-cta__text">
              {t("auth:cta.text")}
            </p>
          </div>

          <div className="login-cta__actions">
            <Link className="login-cta__btn login-cta__btn--primary cta-pulse" to="/membership">
              <FaStar aria-hidden />
              {t("auth:cta.upgradeMembership")}
            </Link>
            <Link className="login-cta__btn login-cta__btn--secondary cta-pulse" to="/sponsorship">
              <FaHandshake aria-hidden />
              {t("auth:cta.becomeSponsor")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
