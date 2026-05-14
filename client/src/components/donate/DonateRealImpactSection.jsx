import {
  FaBolt,
  FaMasksTheater,
  FaStar,
  FaUsers,
  FaFaceSmileBeam,
} from "react-icons/fa6";
import footerBackground from "../../assets/footer-bg.png";
import "../../styles/donate-real-impact-section.css";

/** Same figures and headlines as `OurImpactSection` (home) */
const stats = [
  { value: "10+", label: "High-Production Events", Icon: FaBolt },
  { value: "3+", label: "Premier Venues", Icon: FaMasksTheater },
  { value: "125+", label: "Artists Amplified", Icon: FaStar },
  { value: "12+", label: "Expert Members", Icon: FaUsers },
  { value: "100+", label: "Joyful Hours of Happiness", Icon: FaFaceSmileBeam },
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
