import { Link } from "react-router-dom";
import "../../../styles/vcommerce-marketplace.css";

export default function WholesalerRegistrationSuccessPage() {
  return (
    <div className="vco-page vco-page--center">
      <div className="mkt-success-card">
        <div className="mkt-success-card__icon" aria-hidden>📦</div>
        <h1 className="mkt-success-card__title">Application Received!</h1>
        <p className="mkt-success-card__text">
          Your wholesaler account application has been submitted. Our team will review it and get back to you
          within 1–2 business days.
        </p>
        <div className="mkt-success-card__steps">
          <div className="mkt-success-card__step">
            <span className="mkt-success-card__step-num">1</span>
            <span>Application under review</span>
          </div>
          <div className="mkt-success-card__step">
            <span className="mkt-success-card__step-num">2</span>
            <span>Approval notification by email</span>
          </div>
          <div className="mkt-success-card__step">
            <span className="mkt-success-card__step-num">3</span>
            <span>Access wholesale pricing &amp; bulk ordering</span>
          </div>
        </div>
        <div className="mkt-success-card__actions">
          <Link to="/vcommerce" className="vco-btn vco-btn--primary">Browse Marketplace</Link>
          <Link to="/dashboard" className="vco-btn vco-btn--ghost">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
