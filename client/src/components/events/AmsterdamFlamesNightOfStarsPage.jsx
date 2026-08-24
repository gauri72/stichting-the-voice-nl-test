import { IconCalendarEvent, IconClock, IconMapPin2, IconStarFilled, IconToolsKitchen2, IconMicrophone2, IconUsersGroup } from "@tabler/icons-react";
import "../../styles/amsterdam-flames-event.css";
import AmsterdamFlamesEmbers from "./AmsterdamFlamesEmbers.jsx";

const CREST_URL = "/amsterdam-flames/af-crest-orange.png";
const TICKETS_URL = "/events/amsterdam-flames-night-of-the-stars/tickets";
const VENUE_MAPS_QUERY = encodeURIComponent(
  "The Hague Marriott Hotel, Johan de Wittlaan 30, 2517 JR Den Haag"
);

const INCLUDES = [
  {
    icon: IconStarFilled,
    title: "Meet The Stars",
    body: "Spend the evening with top players and special guests.",
  },
  {
    icon: IconToolsKitchen2,
    title: "Premium Dining",
    body: "Enjoy a refined dinner experience and drinks.",
  },
  {
    icon: IconMicrophone2,
    title: "Exclusive Program",
    body: "Interviews, stories, entertainment and more.",
  },
  {
    icon: IconUsersGroup,
    title: "Great Company",
    body: "Connect with fellow supporters and the Flames family.",
  },
];

export default function AmsterdamFlamesNightOfStarsPage() {
  return (
    <div className="af-event">
      <header className="af-event__topbar">
        <img src={CREST_URL} alt="Amsterdam Flames" className="af-event__crest" />
        <span className="af-event__brand">AMSTERDAM FLAMES</span>
        <span className="af-event__partner">Hosted with Stichting The V.O.I.C.E. NL</span>
      </header>

      <section className="af-squad">
        <img
          src="/amsterdam-flames/squad-banner.png"
          alt="Amsterdam Flames squad — Night Of The Stars"
          className="af-squad__banner"
        />
      </section>

      <section className="af-event__hero">
        <AmsterdamFlamesEmbers />
        <div className="af-event__hero-content">
          <p className="af-event__eyebrow">An Exclusive Evening</p>
          <h1 className="af-event__title">
            Amsterdam Flames:
            <br />
            <span className="af-event__title-accent">Night Of The Stars</span>
          </h1>
          <p className="af-event__tagline">
            Join us for a spectacular evening with the Amsterdam Flames. Good food, good company, and the club's biggest names.
          </p>

          <div className="af-info-bar">
            <div className="af-info-bar__item">
              <IconCalendarEvent size={22} />
              <div>
                <span>Saturday</span>
                <strong>5 September 2026</strong>
              </div>
            </div>
            <div className="af-info-bar__item">
              <IconClock size={22} />
              <div>
                <span>Time</span>
                <strong>18:00</strong>
              </div>
            </div>
            <div className="af-info-bar__item">
              <IconMapPin2 size={22} />
              <div>
                <span>Venue</span>
                <strong>The Hague Marriott Hotel</strong>
              </div>
            </div>
          </div>

          <a href="#tickets" className="af-event__cta">
            Get Your Tickets
          </a>
        </div>
      </section>

      <section className="af-includes">
        <h2 className="af-includes__title">The Night Includes</h2>
        <div className="af-includes__grid">
          {INCLUDES.map((item) => (
            <div className="af-includes__item" key={item.title}>
              <item.icon size={26} />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="af-event__details">
        <div className="af-event__detail-card">
          <h2>Event Details</h2>
          <ul>
            <li>
              <strong>Date:</strong> Saturday, 5 September 2026
            </li>
            <li>
              <strong>Time:</strong> 18:00 – 22:00
            </li>
            <li>
              <strong>Venue:</strong> The Hague Marriott, Johan de Wittlaan 30, 2517 JR, Den Haag
            </li>
          </ul>
          <a
            className="af-event__map-link"
            href={`https://www.google.com/maps/search/?api=1&query=${VENUE_MAPS_QUERY}`}
            target="_blank"
            rel="noreferrer"
          >
            View venue on map →
          </a>
        </div>

        <div id="tickets" className="af-event__price-card">
          <span className="af-event__price-badge">VIP Experience</span>
          <div className="af-event__price">
            €210<span>per person</span>
          </div>
          <p className="af-event__price-includes">Includes unlimited drinks, snacks and dinner.</p>

          <div className="af-event__promo">
            <p className="af-event__promo-label">Group Booking Discount</p>
            <p className="af-event__promo-copy">Save 10% when booking for 5 people or more.</p>
            <span className="af-event__promo-code">GRP10OFF</span>
          </div>

          <a href={TICKETS_URL} className="af-event__cta af-event__cta--block">
            Get Your Tickets
          </a>
        </div>
      </section>

      <footer className="af-event__footer">
        Tickets sold and fulfilled by Stichting The V.O.I.C.E. NL on behalf of Amsterdam Flames. Not yet listed on the events page.
      </footer>
    </div>
  );
}
