import { useCallback, useEffect, useRef, useState } from "react";
import "../../styles/event-tickets.css";

const TICKET_TAILOR_CHECKOUT_URL =
  "https://www.tickettailor.com/checkout/new-session/id/8167128/chk/49a6/?show_event_filter=false";

function mountTicketTailorWidget(host) {
  if (!host) return;

  host.replaceChildren();

  const widget = document.createElement("div");
  widget.className = "tt-widget";

  const fallback = document.createElement("div");
  fallback.className = "tt-widget-fallback";
  const p = document.createElement("p");
  const link = document.createElement("a");
  link.href = TICKET_TAILOR_CHECKOUT_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Click here to buy tickets";
  const br = document.createElement("br");
  const small = document.createElement("small");
  const powered = document.createElement("a");
  powered.href = "https://www.tickettailor.com?rf=wdg_198212";
  powered.className = "tt-widget-powered";
  powered.textContent = "Sell tickets online with Ticket Tailor";
  small.appendChild(powered);
  p.appendChild(link);
  p.appendChild(br);
  p.appendChild(small);
  fallback.appendChild(p);

  const script = document.createElement("script");
  script.src = "https://cdn.tickettailor.com/js/widgets/min/widget.js";
  script.async = true;
  script.setAttribute("data-url", TICKET_TAILOR_CHECKOUT_URL);
  script.setAttribute("data-type", "inline");
  script.setAttribute("data-inline-minimal", "false");
  script.setAttribute("data-inline-show-logo", "false");
  script.setAttribute("data-inline-bg-fill", "false");
  script.setAttribute("data-inline-inherit-ref-from-url-param", "");
  script.setAttribute("data-inline-ref", "");

  widget.appendChild(fallback);
  widget.appendChild(script);
  host.appendChild(widget);
}

export default function UpcomingEventsSection() {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const sectionRef = useRef(null);
  const widgetHostRef = useRef(null);

  const openWidget = useCallback(() => {
    setWidgetOpen(true);
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    if (!widgetOpen) return undefined;
    const host = widgetHostRef.current;
    mountTicketTailorWidget(host);
    return () => {
      if (host) host.replaceChildren();
    };
  }, [widgetOpen]);

  return (
    <section
      id="upcoming-events"
      ref={sectionRef}
      className={`event-tickets-section${widgetOpen ? " event-tickets-section--open" : ""}`}
      aria-labelledby="upcoming-events-title"
    >
      <div className="event-tickets-section__inner">
        <div className="event-tickets-section__label-row">
          <span className="event-tickets-section__label-line" aria-hidden="true" />
          <h2 id="upcoming-events-title" className="event-tickets-section__label">
            Upcoming Events
          </h2>
          <span className="event-tickets-section__label-line" aria-hidden="true" />
        </div>

        {!widgetOpen ? (
          <div className="event-tickets-section__intro">
            <p className="event-tickets-section__heading">
              V.O.I.C.E. NL Presents Couples Night - A Ballroom Theme Experience, on June 20th,
              2026, Den Haag. Click below for more information.
            </p>
            <button type="button" className="event-tickets-section__open-btn" onClick={openWidget}>
              View upcoming events &amp; tickets
            </button>
          </div>
        ) : (
          <div className="event-tickets-section__content">
            <div className="event-tickets-panel">
              <div
                className="event-tickets-widget-host"
                ref={widgetHostRef}
                aria-label="Ticket checkout widget"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
