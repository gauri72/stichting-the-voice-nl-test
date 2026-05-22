import { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import "../../styles/membership-events-section.css";

const MEMBERSHIP_WIDGET_URL =
  "https://www.tickettailor.com/checkout/new-session/store/38274/chk/84ad?ref=website_widget_5&srch=membership&show_search_filter=true&show_date_filter=true&show_sort=true&minimal=true&bg_fill=true&show_logo=false&inherit_ref_from_url_param=";

function mountMembershipTicketTailorWidget(host) {
  if (!host) return;

  host.replaceChildren();

  const widget = document.createElement("div");
  widget.className = "tt-widget";

  const fallback = document.createElement("div");
  fallback.className = "tt-widget-fallback";
  const p = document.createElement("p");
  const link = document.createElement("a");
  link.href = MEMBERSHIP_WIDGET_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Click here to view memberships";
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
  script.setAttribute("data-url", MEMBERSHIP_WIDGET_URL);
  script.setAttribute("data-type", "inline");
  script.setAttribute("data-inline-minimal", "true");
  script.setAttribute("data-inline-show-logo", "false");
  script.setAttribute("data-inline-bg-fill", "true");
  script.setAttribute("data-inline-inherit-ref-from-url-param", "");
  script.setAttribute("data-inline-ref", "website_widget_5");

  widget.appendChild(fallback);
  widget.appendChild(script);
  host.appendChild(widget);
}

export default function MembershipEventsSection({ visible = false, onClose = () => {} }) {
  const widgetHostRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    const host = widgetHostRef.current;
    mountMembershipTicketTailorWidget(host);
    return () => {
      if (host) host.replaceChildren();
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <section
      id="voice-nl-memberships"
      className="membership-events"
      aria-label="Membership events listing"
    >
      <div className="membership-events__container">
        <div className="membership-events__heading">
          <span className="membership-events__heading-spacer" aria-hidden="true" />
          <span className="membership-events__heading-line" aria-hidden="true" />
          <h2 className="membership-events__title">V.O.I.C.E. NL Memberships</h2>
          <span className="membership-events__heading-line" aria-hidden="true" />
          <button
            type="button"
            className="membership-events__close"
            onClick={onClose}
            aria-label="Close memberships section"
          >
            <FaTimes aria-hidden />
          </button>
        </div>
        <div
          className="membership-events__widget-host"
          ref={widgetHostRef}
          aria-label="Membership checkout widget"
        />
      </div>
    </section>
  );
}
