import { FaPlay, FaCalendarCheck, FaHandshake, FaUsers } from "react-icons/fa6";
import { FaHandHoldingHeart } from "react-icons/fa";
import timeline2015 from "../../assets/Events/signature-events-4.png";
import timeline2017 from "../../assets/Events/signature-events-2.png";
import timeline2019 from "../../assets/Events/signature-events-3.png";
import timeline2021 from "../../assets/Events/signature-events-1.png";
import timeline2023 from "../../assets/Events/signature-events-6.png";
import timeline2024 from "../../assets/Events/signature-events-5.png";
import "../../styles/events-impact-timeline-section.css";

const timelineItems = [
  { year: "2015", label: "Shaam-e-Ghazal", image: timeline2015 },
  { year: "2017", label: "Music Festival", image: timeline2017 },
  { year: "2019", label: "Dance Festival", image: timeline2019 },
  { year: "2021", label: "Short Film Festival", image: timeline2021 },
  { year: "2023", label: "Her Beats Her Night", image: timeline2023 },
  { year: "2024", label: "KNCB Cricket Festival", image: timeline2024 },
];

const impactStats = [
  { icon: FaCalendarCheck, value: "50+", label: "Events Hosted" },
  { icon: FaUsers, value: "35K+", label: "Attendees" },
  { icon: FaHandshake, value: "100+", label: "Community Partners" },
  { icon: FaHandHoldingHeart, value: "1,000+", label: "Volunteers Engaged" },
];

export default function EventsImpactTimelineSection() {
  return (
    <section
      id="events-highlights"
      className="events-impact"
      aria-labelledby="events-impact-title"
    >
      <div className="events-impact__inner">
        <div className="events-impact__layout">
          <div className="events-impact__intro">
            <h2 id="events-impact-title" className="events-impact__title">
              <span className="events-impact__title-line">Memorable Moments,</span>
              <span className="events-impact__title-accent">Lasting Impact</span>
            </h2>
            <p className="events-impact__lead">
              Over the years, our events have created unforgettable experiences and strengthened the
              bonds within our community.
            </p>
            <a className="events-impact__video-cta" href="#events-highlights">
              <FaPlay className="events-impact__video-cta-icon" aria-hidden="true" />
              <span>Watch Highlights Video</span>
              <span className="events-impact__video-cta-play" aria-hidden="true">
                <FaPlay />
              </span>
            </a>
          </div>

          <div className="events-impact__gallery">
            <div className="events-impact__timeline" aria-label="Event highlights by year">
              <div className="events-impact__timeline-track" role="list">
                {timelineItems.map(({ year, label, image }, index) => (
                  <article
                    key={year}
                    className="events-impact__timeline-item"
                    role="listitem"
                    style={{ "--timeline-col": index + 1 }}
                  >
                    <div className="events-impact__timeline-label">
                      <p className="events-impact__timeline-year">{year}</p>
                      <p className="events-impact__timeline-event">{label}</p>
                    </div>
                    <span className="events-impact__timeline-dot" aria-hidden="true" />
                    <button
                      type="button"
                      className="events-impact__thumb"
                      aria-label={`Play ${label} highlight`}
                    >
                      <img src={image} alt="" />
                      <span className="events-impact__thumb-play" aria-hidden="true">
                        <FaPlay />
                      </span>
                    </button>
                  </article>
                ))}
              </div>
            </div>

            <div className="events-impact__stats" role="list" aria-label="Event impact statistics">
              {impactStats.map(({ icon: Icon, value, label }) => (
                <article key={label} className="events-impact__stat" role="listitem">
                  <span className="events-impact__stat-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div className="events-impact__stat-text">
                    <p className="events-impact__stat-value">{value}</p>
                    <p className="events-impact__stat-label">{label}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
