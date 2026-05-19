import {
  FaGlobe,
  FaGraduationCap,
  FaHeartbeat,
  FaLeaf,
  FaMusic,
  FaUsers,
} from "react-icons/fa";
import "../../styles/donate-section-heading.css";
import "../../styles/donate-allocation-section.css";

const items = [
  {
    title: "Arts & Culture",
    text: "Live performances, festivals, and creative showcases that celebrate diverse voices.",
    Icon: FaMusic,
  },
  {
    title: "Community Programs",
    text: "Neighbourhood events and gatherings that build trust, joy, and belonging.",
    Icon: FaUsers,
  },
  {
    title: "Education & Youth",
    text: "Workshops, mentorship, and learning paths that open doors for the next generation.",
    Icon: FaGraduationCap,
  },
  {
    title: "Health & Wellness",
    text: "Initiatives that support wellbeing through culture, movement, and mindful connection.",
    Icon: FaHeartbeat,
  },
  {
    title: "Cultural Exchange",
    text: "International collaborations that widen perspectives and deepen mutual respect.",
    Icon: FaGlobe,
  },
  {
    title: "Sustainability",
    text: "Greener events and responsible operations that care for people and planet.",
    Icon: FaLeaf,
  },
];

export default function DonateAllocationSection() {
  return (
    <section className="donate-allocation" aria-labelledby="donate-allocation-title">
      <div className="donate-allocation__container">
        <header className="donate-section__header">
          <div className="donate-section__heading">
            <span className="donate-section__heading-line" aria-hidden="true" />
            <h2 id="donate-allocation-title" className="donate-section__title">
              Where Your Donation Goes
            </h2>
            <span className="donate-section__heading-line" aria-hidden="true" />
          </div>
        </header>

        <div className="donate-allocation__grid" role="list">
          {items.map(({ title, text, Icon }) => (
            <article key={title} className="donate-allocation__item" role="listitem">
              <span className="donate-allocation__icon" aria-hidden="true">
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
