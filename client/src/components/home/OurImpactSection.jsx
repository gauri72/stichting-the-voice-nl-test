import { Link } from "react-router-dom";
import { impactStats } from "../../data/impactStats.js";
import "../../styles/our-impact.css";

export default function OurImpactSection() {
  return (
    <section className="our-impact-section" aria-labelledby="our-impact-title">
      <div className="our-impact-top">
        <div className="our-impact-heading-row">
          <span className="our-impact-heading-line" aria-hidden="true" />
          <h2 id="our-impact-title" className="our-impact-heading">
            Our Impact
          </h2>
          <span className="our-impact-heading-line" aria-hidden="true" />
        </div>

        <div className="our-impact-stats" role="list" aria-label="Impact highlights">
          {impactStats.map(({ icon: Icon, value, title, detail }) => (
            <article key={title} className="our-impact-stat" role="listitem">
              <span className="our-impact-icon" aria-hidden="true">
                <Icon />
              </span>
              <div>
                <p className="our-impact-value">{value}</p>
                <p className="our-impact-title">{title}</p>
                <p className="our-impact-detail">{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="our-impact-actions">
        <article className="our-impact-action-card">
          <p className="our-impact-action-label">Join Us</p>
          <h3>Be Part of the Change</h3>
          <p>
            Become a member or sponsor and help us continue creating meaningful impact through art
            and community.
          </p>
          <Link className="our-impact-action-button" to="/membership">
            Become a Member
          </Link>
        </article>

        <article className="our-impact-action-card">
          <p className="our-impact-action-label">Sponsor Us</p>
          <h3>Support. Empower. Transform.</h3>
          <p>
            Your sponsorship helps us deliver cultural programs, elevate artists, and create wider
            community engagement.
          </p>
          <Link className="our-impact-action-button" to="/sponsorship">
            Become a Sponsor
          </Link>
        </article>

        <article className="our-impact-action-card">
          <p className="our-impact-action-label">Donate</p>
          <h3>Give Hope Through Culture.</h3>
          <p>
            Every contribution powers inclusive events, nurtures young talent, and keeps community-led
            creativity thriving.
          </p>
          <Link className="our-impact-action-button" to="/donate">
            Donate Now
          </Link>
        </article>
      </div>
    </section>
  );
}
