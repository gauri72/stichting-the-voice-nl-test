import { FaTimes } from "react-icons/fa";
import "../../styles/membership-events-section.css";

const MEMBERSHIP_WIDGET_URL =
  "https://www.tickettailor.com/checkout/new-session/store/38274/chk/84ad?ref=website_widget_5&srch=membership&show_search_filter=true&show_date_filter=true&show_sort=true&minimal=true&bg_fill=true&show_logo=false&inherit_ref_from_url_param=";

export default function MembershipEventsSection({ visible = false, onClose = () => {} }) {
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
        <iframe
          className="membership-events__iframe"
          src={MEMBERSHIP_WIDGET_URL}
          title="Membership Events"
          loading="lazy"
          scrolling="no"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </section>
  );
}
