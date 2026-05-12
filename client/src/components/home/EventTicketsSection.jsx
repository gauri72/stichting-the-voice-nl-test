import { useEffect, useRef } from "react";
import "../../styles/event-tickets.css";

const TICKET_TAILOR_CHECKOUT_URL =
  "https://www.tickettailor.com/checkout/new-session/id/8167128/chk/49a6/?show_event_filter=false";

export default function EventTicketsSection() {
  const widgetHostRef = useRef(null);

  useEffect(() => {
    const host = widgetHostRef.current;
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

    return () => {
      host.replaceChildren();
    };
  }, []);

  return (
    <section className="event-tickets-section" aria-label="Events and tickets">
      <div className="event-tickets-section__inner">
        <div className="event-tickets-section__label-row">
          <span className="event-tickets-section__label-line" aria-hidden="true" />
          <p className="event-tickets-section__label">Join Us</p>
          <span className="event-tickets-section__label-line" aria-hidden="true" />
        </div>

        <div className="event-tickets-section__content">
          <div className="event-tickets-panel">
            <div
              className="event-tickets-widget-host"
              ref={widgetHostRef}
              aria-label="Ticket checkout widget"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
