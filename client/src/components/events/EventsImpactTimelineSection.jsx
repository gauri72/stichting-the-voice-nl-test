import { useState } from "react";
import { IconArrowRight } from "@tabler/icons-react";
import { eventsTimelineItems } from "../../data/eventsTimelineItems.js";
import { getHighlightGallery } from "../../config/eventHighlights.js";
import EventsHighlightsGallery from "./EventsHighlightsGallery.jsx";
import "../../styles/events-impact-timeline-section.css";

export default function EventsImpactTimelineSection() {
  const [activeGallery, setActiveGallery] = useState(null);

  function openHighlights(highlightId) {
    const gallery = getHighlightGallery(highlightId);
    if (gallery) setActiveGallery(gallery);
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
            <button
              type="button"
              className="events-impact__highlights-cta"
              onClick={() => openHighlights(eventsTimelineItems[0]?.highlightId)}
            >
              View Highlights
              <IconArrowRight className="events-impact__highlights-cta-icon" aria-hidden stroke={1.75} />
            </button>
          </div>

          <div className="events-impact__gallery">
            <p className="events-impact__scroll-hint" aria-hidden="true">
              Swipe to explore events
            </p>
            <div className="events-impact__timeline" aria-label="Event highlights timeline">
              <div className="events-impact__timeline-track" role="list">
                {eventsTimelineItems.map(({ highlightId, title, years, image }, index) => (
                  <article
                    key={highlightId}
                    className="events-impact__timeline-item"
                    role="listitem"
                    style={{ "--timeline-col": index + 1 }}
                  >
                    <div className="events-impact__timeline-years-slot">
                      <p className="events-impact__timeline-years">{years}</p>
                    </div>
                    <div className="events-impact__timeline-event-slot">
                      <h3 className="events-impact__timeline-event">{title}</h3>
                    </div>
                    <span className="events-impact__timeline-dot" aria-hidden="true" />
                    <button
                      type="button"
                      className="events-impact__thumb"
                      onClick={() => openHighlights(highlightId)}
                      aria-label={`View ${title} highlights`}
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

      <EventsHighlightsGallery gallery={activeGallery} onClose={() => setActiveGallery(null)} />
    </section>
  );
}
