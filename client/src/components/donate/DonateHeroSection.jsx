import { FaArrowRightLong } from "react-icons/fa6";
import { FaHeart } from "react-icons/fa";
import heroBackground from "../../assets/Donate Now/hero-bg.png";
import "../../styles/donate-hero-section.css";

export default function DonateHeroSection() {
  return (
    <section
      className="donate-page-hero"
      aria-labelledby="donate-hero-title"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="donate-page-hero__container">
        <h1 id="donate-hero-title">
          <span className="donate-page-hero__title-line">Your Donation.</span>
          <span className="donate-page-hero__title-gradient">Their Future.</span>
        </h1>
        <p className="donate-page-hero__intro">
          Your support empowers art, culture, and community initiatives that inspire, educate and unite
          people across the world. Together, we can create a better tomorrow.
        </p>
        <div className="donate-page-hero__actions">
          <a className="donate-page-hero__cta donate-page-hero__cta--primary" href="#donate-tiers">
            <FaHeart aria-hidden />
            Donate Now
            <FaArrowRightLong aria-hidden />
          </a>
          <a className="donate-page-hero__cta donate-page-hero__cta--secondary" href="#donate-other-ways">
            Other Ways to Give
          </a>
        </div>
      </div>
    </section>
  );
}
