import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function VCommerceApplicationSuccessPage() {
  const { t } = useTranslation(["vcommercePortal"]);
  return (
    <div className="vco-apply-page">
      <div className="vco-apply-page__inner vco-apply-page__gate">
        <div className="vco-gate-icon">🎉</div>
        <h1 className="vco-apply-page__title">{t("vcommercePortal:applicationSuccess.title")}</h1>
        <p className="vco-apply-page__subtitle">
          {t("vcommercePortal:applicationSuccess.subtitlePrefix")}{" "}
          <strong>{t("vcommercePortal:applicationSuccess.subtitleStrong")}</strong>.
        </p>
        <div className="vco-success-steps">
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">1</span>
            <span>{t("vcommercePortal:applicationSuccess.steps.reviewed")}</span>
          </div>
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">2</span>
            <span>{t("vcommercePortal:applicationSuccess.steps.approvalEmail")}</span>
          </div>
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">3</span>
            <span>{t("vcommercePortal:applicationSuccess.steps.setupStorefront")}</span>
          </div>
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">4</span>
            <span>{t("vcommercePortal:applicationSuccess.steps.startSelling")}</span>
          </div>
        </div>
        <Link to="/vcommerce" className="vco-btn vco-btn--primary">
          {t("vcommercePortal:applicationSuccess.exploreButton")}
        </Link>
        <Link to="/dashboard" className="vco-btn vco-btn--ghost">
          {t("vcommercePortal:applicationSuccess.dashboardButton")}
        </Link>
      </div>
    </div>
  );
}
