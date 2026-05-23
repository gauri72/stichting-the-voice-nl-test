import { Link } from "react-router-dom";
import { FaArrowRightLong, FaUser } from "react-icons/fa6";
import { FaHandshake, FaUsers } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa6";
import heroLogo from "../../assets/Venture Studio/hero-logo.png";
import "../../styles/venture-studio-hero-section.css";

const PILLARS = [
  {
    icon: FaUsers,
    variant: "filled",
    title: "A MOVEMENT",
    text: "We believe in the power of community and collective progress."
  },
  {
    icon: FaRegHeart,
    variant: "outline",
    title: "A CAUSE",
    text: "We exist to empower youth and create sustainable opportunities."
  },
  {
    icon: FaHandshake,
    variant: "filled",
    title: "A PROMISE",
    text: "Every project we deliver helps build a better tomorrow."
  }
];

export default function VentureStudioHeroSection() {
  return (
    <section className="vvs-hero" aria-labelledby="vvs-hero-title">
      <div className="vvs-hero__inner">
        <div className="vvs-hero__left">
          <h1 id="vvs-hero-title" className="vvs-hero__title">
            <span className="vvs-hero__title-line">Empower Youth.</span>
            <span className="vvs-hero__title-line">Build Skills.</span>
            <span className="vvs-hero__title-line">Create Impact.</span>
            <span className="vvs-hero__title-accent">Shape the Future.</span>
          </h1>
          <p className="vvs-hero__intro">
            V.O.I.C.E. Venture Studio is a movement and a cause to create internships and help
            young people grow T-shape skills before they step into the world.
          </p>
          <div className="vvs-hero__actions">
            <a className="vvs-hero__cta vvs-hero__cta--primary" href="#vvs-contact">
              Explore Our Services
              <FaArrowRightLong aria-hidden />
            </a>
            <Link className="vvs-hero__cta vvs-hero__cta--outline" to="/membership">
              <FaUser aria-hidden />
              Become a Member
            </Link>
          </div>
        </div>

        <div className="vvs-hero__center">
          <img
            className="vvs-hero__logo"
            src={heroLogo}
            alt="V.O.I.C.E. Venture Studio — Digital Growth, Onboarding, Strategy"
          />
        </div>

        <aside className="vvs-hero__right" aria-label="Our values">
          {PILLARS.map(({ icon: Icon, variant, title, text }) => (
            <article key={title} className="vvs-hero__pillar">
              <span
                className={`vvs-hero__pillar-icon vvs-hero__pillar-icon--${variant}`}
                aria-hidden
              >
                <Icon />
              </span>
              <div className="vvs-hero__pillar-body">
                <h2 className="vvs-hero__pillar-title">{title}</h2>
                <p className="vvs-hero__pillar-text">{text}</p>
              </div>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
