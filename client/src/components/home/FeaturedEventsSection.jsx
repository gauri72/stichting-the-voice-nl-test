import { useEffect, useState } from "react";
import { IoArrowForward, IoLocationOutline, IoTimeOutline } from "react-icons/io5";
import featuredLight from "../../assets/Home/featured events-light.png";
import featuredDark from "../../assets/Home/featured events-dark.png";
import "../../styles/featured-events-section.css";

const FEATURED_EVENT_TICKETS_URL =
  "https://www.tickettailor.com/events/stichtingthevoicenl/2185529";
const FEATURED_EVENT_DATE = new Date("2026-06-20T20:00:00+02:00");

function getRemainingTimeLabel() {
  const diffMs = FEATURED_EVENT_DATE.getTime() - Date.now();
  if (diffMs <= 0) return "Live now";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return `${days}d ${hours}h ${minutes}m`;
}

export default function FeaturedEventsSection() {
  const [timeRemaining, setTimeRemaining] = useState(() => getRemainingTimeLabel());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeRemaining(getRemainingTimeLabel());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="featured-events-section" aria-labelledby="featured-events-title">
      <article
        className="featured-events-card"
        style={{
          "--featured-events-bg-light": `url(${featuredLight})`,
          "--featured-events-bg-dark": `url(${featuredDark})`,
        }}
      >
        <div className="featured-events-top">
          <div className="featured-events-date">
            <span className="featured-events-date__month">JUN</span>
            <span className="featured-events-date__day">20</span>
          </div>

          <div className="featured-events-content">
            <p id="featured-events-title" className="featured-events-eyebrow">
              Featured Event
            </p>
            <h2 className="featured-events-title">Couples Night</h2>
            <p className="featured-events-description">
              A special evening of connection, entertainment and inspiration for couples.
            </p>
          </div>
        </div>

        <div className="featured-events-meta" aria-label="Event details">
          <p className="featured-events-meta-item">
            <IoLocationOutline aria-hidden />
            <span>Kinepolis</span>
          </p>
          <p className="featured-events-meta-item featured-events-meta-item--time">
            <IoTimeOutline aria-hidden />
            <span>{timeRemaining}</span>
          </p>
        </div>

        <a
          className="featured-events-cta"
          href={FEATURED_EVENT_TICKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View featured event tickets on Ticket Tailor"
        >
          <IoArrowForward aria-hidden />
        </a>
      </article>
    </section>
  );
}
