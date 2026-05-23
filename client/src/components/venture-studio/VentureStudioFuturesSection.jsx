import { FaCheck } from "react-icons/fa6";
import "../../styles/venture-studio-futures-section.css";
import futuresPhoto from "../../assets/Home/team/team-2.png";

const POINTS = [
  "Internships that open doors to real careers",
  "Project-based learning with industry mentors",
  "Digital skills that meet tomorrow's demands",
  "A network of partners invested in youth success",
  "Programs that turn potential into lasting impact"
];

export default function VentureStudioFuturesSection() {
  return (
    <section className="vvs-futures" aria-labelledby="vvs-futures-heading">
      <div className="vvs-futures__inner">
        <div className="vvs-futures__media">
          <img src={futuresPhoto} alt="Young people collaborating around a laptop" />
        </div>
        <div className="vvs-futures__content">
          <h2 id="vvs-futures-heading" className="vvs-section-title">
            Together, We Build Futures.
          </h2>
          <ul className="vvs-futures__list">
            {POINTS.map((point) => (
              <li key={point}>
                <span className="vvs-futures__check" aria-hidden>
                  <FaCheck />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <p className="vvs-futures__closing">
            Be the reason a young person&apos;s future changes.
          </p>
          <div className="vvs-futures__brush" aria-hidden>
            <span>Invest in Youth. Invest in Tomorrow.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
