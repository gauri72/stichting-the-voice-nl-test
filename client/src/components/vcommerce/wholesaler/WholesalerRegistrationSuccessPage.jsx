import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../../styles/vcommerce-marketplace.css";

export default function WholesalerRegistrationSuccessPage() {
  const { t } = useTranslation(["vcommercePortal"]);
  return (
    <div className="vco-page vco-page--center">
      <div className="mkt-success-card">
        <div className="mkt-success-card__icon" aria-hidden>📦</div>
        <h1 className="mkt-success-card__title">{t("vcommercePortal:wholesalerRegisterSuccess.title")}</h1>
        <p className="mkt-success-card__text">
          {t("vcommercePortal:wholesalerRegisterSuccess.text")}
        </p>
        <div className="mkt-success-card__steps">
          <div className="mkt-success-card__step">
            <span className="mkt-success-card__step-num">1</span>
            <span>{t("vcommercePortal:wholesalerRegisterSuccess.steps.underReview")}</span>
          </div>
          <div className="mkt-success-card__step">
            <span className="mkt-success-card__step-num">2</span>
            <span>{t("vcommercePortal:wholesalerRegisterSuccess.steps.approvalEmail")}</span>
          </div>
          <div className="mkt-success-card__step">
            <span className="mkt-success-card__step-num">3</span>
            <span>{t("vcommercePortal:wholesalerRegisterSuccess.steps.accessPricing")}</span>
          </div>
        </div>
        <div className="mkt-success-card__actions">
          <Link to="/vcommerce" className="vco-btn vco-btn--primary">{t("vcommercePortal:wholesalerRegisterSuccess.browseMarketplace")}</Link>
          <Link to="/dashboard" className="vco-btn vco-btn--ghost">{t("vcommercePortal:wholesalerRegisterSuccess.goToDashboard")}</Link>
        </div>
      </div>
    </div>
  );
}
