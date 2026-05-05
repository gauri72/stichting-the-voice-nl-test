import { FaEye, FaHandsHelping, FaUsers } from "react-icons/fa";
import "../../styles/about-section.css";

const pillars = [
  {
    title: "Our Mission",
    description:
      "To empower individuals and communities through culture, creativity and collaboration.",
    icon: FaUsers
  },
  {
    title: "Our Vision",
    description: "A society where diversity is celebrated, voices are heard, and everyone belongs.",
    icon: FaEye
  },
  {
    title: "Our Values",
    description:
      "Inclusivity, integrity, creativity and community are at the heart of everything we do.",
    icon: FaHandsHelping
  }
];

export default function AboutSection() {
  return (
    <section className="home-about-section">
      <div className="home-about-grid">
        <div className="home-about-pillars" aria-label="Our mission, vision and values">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article key={title} className="home-about-pillar">
              <Icon className="home-about-icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
