import { useState } from "react";
import { IconMapPinFilled } from "@tabler/icons-react";
import { eventsTimelineItems } from "../../data/eventsTimelineItems.js";
import EventsYouTubeShortsPip from "./EventsYouTubeShortsPip.jsx";
import "../../styles/events-impact-timeline-section.css";

export default function EventsImpactTimelineSection() {
  const [activeVideo, setActiveVideo] = useState(null);

  function openHighlightVideo({ title, youtubeId }) {
    if (youtubeId) setActiveVideo({ title, youtubeId });
  }

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
              <span className="events-impact__title-emphasis">Lasting Impact</span>
            </h2>
            <p className="events-impact__lead">
              Over the years, our events have created unforgettable experiences and strengthened the
              bonds within our community.
            </p>
          </div>

          <div className="events-impact__gallery">
            <p className="events-impact__scroll-hint" aria-hidden="true">
              Swipe to explore events
            </p>
            <div className="events-impact__timeline" aria-label="Event highlights timeline">
              <div className="events-impact__timeline-track" role="list">
                {eventsTimelineItems.map(({ highlightId, title, years, image, youtubeId }, index) => (
                  <article
                    key={highlightId}
                    className="events-impact__timeline-item"
                    role="listitem"
                    style={{
                      "--timeline-col": index + 1,
                      "--timeline-mobile-col": (index % 3) + 1,
                      "--timeline-band": Math.floor(index / 3),
                    }}
                  >
                    <div className="events-impact__timeline-rail" aria-hidden="true">
                      <span className="events-impact__timeline-rail-bar" />
                      <span className="events-impact__timeline-marker">
                        <IconMapPinFilled className="events-impact__timeline-marker-icon" aria-hidden />
                      </span>
                    </div>
                    <div className="events-impact__timeline-years-slot">
                      <p className="events-impact__timeline-years">{years}</p>
                    </div>
                    <div className="events-impact__timeline-event-slot">
                      <h3 className="events-impact__timeline-event">{title}</h3>
                    </div>
                    <button
                      type="button"
                      className="events-impact__thumb"
                      onClick={() => openHighlightVideo({ title, youtubeId })}
                      aria-label={`Play ${title} highlight video`}
                    >
                      <span className="events-impact__thumb-inner">
                        <img src={image} alt="" />
                      </span>
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EventsYouTubeShortsPip video={activeVideo} onClose={() => setActiveVideo(null)} />
    </section>
  );
}
