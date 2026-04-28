import {
  FaGraduationCap,
  FaHeartPulse,
  FaMasksTheater,
  FaMusic,
  FaSeedling,
  FaUsers
} from "react-icons/fa6";
import "../../styles/focus-areas.css";

const focusAreas = [
  {
    title: "Music",
    description: "Promoting music and live performances",
    icon: FaMusic
  },
  {
    title: "Art & Culture",
    description: "Encouraging creative expression",
    icon: FaMasksTheater
  },
  {
    title: "Social Causes",
    description: "Supporting community well-being",
    icon: FaUsers
  },
  {
    title: "Education",
    description: "Empowering through learning",
    icon: FaGraduationCap
  },
  {
    title: "Health & Wellness",
    description: "Building healthier communities",
    icon: FaHeartPulse
  },
  {
    title: "Sustainability",
    description: "Working for a better tomorrow",
    icon: FaSeedling
  }
];

export default function FocusAreasSection() {
  return (
    <section className="focus-areas-section" aria-labelledby="focus-areas-title">
      <div className="focus-areas-inner">
        <h2 id="focus-areas-title" className="focus-areas-title">
          Our Focus Areas
        </h2>

        <div className="focus-areas-grid" role="list" aria-label="Our focus areas">
          {focusAreas.map(({ title, description, icon: Icon }) => (
            <article key={title} className="focus-area-item" role="listitem">
              <Icon className="focus-area-icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
