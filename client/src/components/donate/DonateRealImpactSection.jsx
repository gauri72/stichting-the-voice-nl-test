import {
  FaHandHoldingHeart,
  FaHandshake,
  FaRegCalendarAlt,
  FaRegStar,
  FaUsers,
} from "react-icons/fa";
import footerBackground from "../../assets/footer-bg.png";
import "../../styles/donate-real-impact-section.css";

const stats = [
  { value: "150+", label: "Events Organized", Icon: FaRegCalendarAlt },
  { value: "25K+", label: "Lives Impacted", Icon: FaUsers },
  { value: "500+", label: "Volunteers", Icon: FaHandHoldingHeart },
  { value: "100+", label: "Partners", Icon: FaHandshake },
  { value: "10+", label: "Years of Service", Icon: FaRegStar },
];

export default function DonateRealImpactSection() {
  return (
    <section
      className="donate-impact"
      aria-labelledby="donate-impact-title"
      style={{ backgroundImage: `url(${footerBackground})` }}
    >
      <div className="donate-impact__overlay" aria-hidden="true" />
      <div className="donate-impact__inner">
        <div className="donate-impact__intro">
          <h2 id="donate-impact-title" className="donate-impact__title">
            <span className="donate-impact__title-line">Real Impact.</span>
            <span className="donate-impact__title-gradient">Real Change.</span>
          </h2>
        </div>
        <ul className="donate-impact__stats" role="list">
          {stats.map(({ value, label, Icon }) => (
            <li key={label} className="donate-impact__stat" role="listitem">
              <span className="donate-impact__stat-icon" aria-hidden="true">
                <Icon />
              </span>
              <div className="donate-impact__stat-text">
                <span className="donate-impact__stat-value">{value}</span>
                <span className="donate-impact__stat-label">{label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
