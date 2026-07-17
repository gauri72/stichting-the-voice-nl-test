import { Link } from "react-router-dom";

export default function VCommerceApplicationSuccessPage() {
  return (
    <div className="vco-apply-page">
      <div className="vco-apply-page__inner vco-apply-page__gate">
        <div className="vco-gate-icon">🎉</div>
        <h1 className="vco-apply-page__title">Application Submitted!</h1>
        <p className="vco-apply-page__subtitle">
          Thank you for applying to V.Commerce — V.O.I.C.E. NL Business Spotlight.
          Our team will review your application and get back to you within <strong>5 business days</strong>.
        </p>
        <div className="vco-success-steps">
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">1</span>
            <span>Application reviewed by our team</span>
          </div>
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">2</span>
            <span>You receive an approval email</span>
          </div>
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">3</span>
            <span>Set up your storefront &amp; add products</span>
          </div>
          <div className="vco-success-steps__item">
            <span className="vco-success-steps__num">4</span>
            <span>Start selling to the V.O.I.C.E. NL community</span>
          </div>
        </div>
        <Link to="/vcommerce" className="vco-btn vco-btn--primary">
          Explore V.Commerce
        </Link>
        <Link to="/dashboard" className="vco-btn vco-btn--ghost">
          Go to My Dashboard
        </Link>
      </div>
    </div>
  );
}
