import { useId } from "react";
import "../../styles/venture-studio-help-section.css";
import { FaBriefcase, FaGraduationCap, FaRocket, FaUsers } from "react-icons/fa6";

const HELP_CARDS = [
  { icon: FaGraduationCap, title: "Internships", tag: "We Create" },
  { icon: FaBriefcase, title: "Real Projects", tag: "They Experience" },
  { icon: FaUsers, title: "Skills", tag: "They Master" },
  { icon: FaRocket, title: "Leaders", tag: "They Become" }
];

const DEPTH_SKILLS = [
  "Technical Skills",
  "Digital Skills",
  "Creative Skills",
  "Analytical Thinking",
  "Domain Knowledge"
];

const BREADTH_SKILLS = [
  "Communication",
  "Collaboration",
  "Problem Solving",
  "Leadership",
  "Adaptability"
];

function TShapeLetterGraphic() {
  const gradientId = useId();

  return (
    <svg
      className="vvs-help__tshape-svg"
      viewBox="0 0 100 118"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="50"
          y1="0"
          x2="50"
          y2="118"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6de8d8" />
          <stop offset="32%" stopColor="#3ecdb8" />
          <stop offset="68%" stopColor="#1aab9a" />
          <stop offset="100%" stopColor="#0f8f90" />
        </linearGradient>
      </defs>
      <g
        fill={`url(#${gradientId})`}
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="92" height="26" rx="13" />
        <rect x="36" y="4" width="28" height="106" rx="14" />
      </g>
    </svg>
  );
}

export default function VentureStudioHelpSection() {
  return (
    <section className="vvs-help" aria-labelledby="vvs-help-heading">
      <div className="vvs-help__inner">
        <div className="vvs-help__left">
          <h2 id="vvs-help-heading" className="vvs-help__heading">
            <span className="vvs-help__title-line">We Help Today.</span>
            <span className="vvs-help__title-line">
              We Prepare <span className="vvs-help__title-accent">For Tomorrow.</span>
            </span>
          </h2>
          <p className="vvs-help__intro">
            Through V.O.I.C.E. Venture Studio, we help organisations grow digitally — and we use
            every success to create opportunities for the next generation.
          </p>
          <div className="vvs-help__cards">
            {HELP_CARDS.map(({ icon: Icon, title, tag }) => (
              <article key={title} className="vvs-help__card">
                <span className="vvs-help__card-icon" aria-hidden>
                  <Icon />
                </span>
                <h3 className="vvs-help__card-title">{title}</h3>
                <p className="vvs-help__card-tag">{tag}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="vvs-help__tshape" aria-labelledby="vvs-tshape-heading">
          <h3 id="vvs-tshape-heading" className="vvs-help__tshape-title">
            T-SHAPE SKILLS FOR THE REAL WORLD
          </h3>
          <p className="vvs-help__tshape-sub">
            We prepare young minds with a powerful blend of depth and breadth.
          </p>
          <div className="vvs-help__tshape-body">
            <div className="vvs-help__tshape-col">
              <h4>Depth (Expertise)</h4>
              <ul>
                {DEPTH_SKILLS.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
            <div className="vvs-help__tshape-letter-wrap">
              <TShapeLetterGraphic />
            </div>
            <div className="vvs-help__tshape-col vvs-help__tshape-col--right">
              <h4>Breadth (Versatility)</h4>
              <ul>
                {BREADTH_SKILLS.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="vvs-help__tshape-footer">
            Deep in one. Strong in many. Ready for anything.
          </p>
        </div>
      </div>
    </section>
  );
}
