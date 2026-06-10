import TEAM_MEMBERS from "../../data/teamMembers.js";
import "../../styles/our-team.css";

export default function OurTeamSection({ sectionClassName = "", marquee = false }) {
  const loopedMembers = marquee ? [...TEAM_MEMBERS, ...TEAM_MEMBERS] : TEAM_MEMBERS;

  return (
    <section
      className={`our-team-section${sectionClassName ? ` ${sectionClassName}` : ""}${
        marquee ? " our-team-section--marquee" : ""
      }`}
      aria-labelledby="our-team-title"
    >
      <div className="our-team-inner">
        <div className="our-team-heading">
          <span className="our-team-heading-line" aria-hidden="true" />
          <h2 id="our-team-title" className="our-team-title">
            Our Team
          </h2>
          <span className="our-team-heading-line" aria-hidden="true" />
        </div>

        {marquee ? (
          <div className="our-team-marquee" aria-label="Our team members">
            <div className="our-team-marquee__track">
              {loopedMembers.map(({ name, role, image }, index) => (
                <article
                  key={`${name}-${index}`}
                  className="our-team-card our-team-card--marquee"
                  role="listitem"
                >
                  <div className="our-team-photo-wrap">
                    <img className="our-team-photo" src={image} alt={name} loading="lazy" />
                  </div>
                  <h3>{name}</h3>
                  <p>{role}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="our-team-grid" role="list" aria-label="Our team members">
            {TEAM_MEMBERS.map(({ name, role, image }) => (
              <article key={name} className="our-team-card" role="listitem">
                <div className="our-team-photo-wrap">
                  <img className="our-team-photo" src={image} alt={name} loading="lazy" />
                </div>
                <h3>{name}</h3>
                <p>{role}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
