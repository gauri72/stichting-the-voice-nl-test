import { Link } from "react-router-dom";
import { FaArrowRightLong, FaCalendarCheck, FaHandshake, FaHeart, FaUsers } from "react-icons/fa6";
import "../../styles/events-call-to-action-section.css";

const journeyStats = [
  { icon: FaCalendarCheck, value: "50+", label: "Events Hosted" },
  { icon: FaUsers, value: "35K+", label: "Attendees Reached" },
  { icon: FaHandshake, value: "100+", label: "Partners" },
  { icon: FaUsers, value: "1,000+", label: "Volunteers" },
];

export default function EventsCallToActionSection() {
  return (
    <section className="events-cta" aria-labelledby="events-cta-journey-title">
      <div className="events-cta__wave" aria-hidden="true" />
      <div className="events-cta__inner">
        <div className="events-cta__journey">
          <h2 id="events-cta-journey-title" className="events-cta__journey-title">
            Our Event Journey
          </h2>
          <p className="events-cta__impact-heading">Our Impact</p>
          <p className="events-cta__journey-text">
            What began as a single cultural gathering has grown into a movement that celebrates
            diversity, empowers artists, and connects communities across borders.
          </p>
        </div>

        <div className="events-cta__stats" role="list" aria-label="Our event impact">
          {journeyStats.map(({ icon: Icon, value, label }) => (
            <article key={label} className="events-cta__stat" role="listitem">
              <span className="events-cta__stat-icon" aria-hidden="true">
                <Icon />
              </span>
              <p className="events-cta__stat-value">{value}</p>
              <p className="events-cta__stat-label">{label}</p>
            </article>
          ))}
        </div>

        <div className="events-cta__future">
          <h3 className="events-cta__future-title">Be Part of Our Future</h3>
          <p className="events-cta__future-text">
            Join us in creating more unforgettable experiences. Whether you attend, volunteer,
            partner, or give — your presence makes the difference.
          </p>
          <div className="events-cta__actions">
            <a className="events-cta__btn events-cta__btn--primary" href="#events-highlights">
              Join Our Next Event
              <FaArrowRightLong aria-hidden="true" />
            </a>
            <Link className="events-cta__btn events-cta__btn--outline" to="/membership">
              Become a Member
            </Link>
            <Link className="events-cta__btn events-cta__btn--outline" to="/donate">
              <FaHeart aria-hidden="true" />
              Donate Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
