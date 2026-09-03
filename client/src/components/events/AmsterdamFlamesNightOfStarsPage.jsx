import { useEffect, useState } from "react";
import {
  IconCalendarEvent,
  IconClock,
  IconMapPin2,
  IconStarFilled,
  IconToolsKitchen2,
  IconMicrophone2,
  IconUsersGroup,
  IconWorld,
  IconGavel,
} from "@tabler/icons-react";
import { apiFetch } from "../../utils/api.js";
import "../../styles/amsterdam-flames-event.css";
import AmsterdamFlamesAwaitsCarousel from "./AmsterdamFlamesAwaitsCarousel.jsx";

const CREST_URL = "/amsterdam-flames/af-crest-orange.png";
const EVENT_SLUG = "amsterdam-flames-night-of-the-stars";
const TICKETS_URL = `/events/${EVENT_SLUG}/tickets`;
const VENUE_MAPS_QUERY = encodeURIComponent(
  "Leonardo Hotel Den Haag Babylon, Bezuidenhoutseweg 53, 2595 AA Den Haag"
);

const AWAITS = [
  {
    icon: IconUsersGroup,
    title: "Who We Are",
    tagline: "More Than a Team",
    body: "Discover the story, people and passion behind Amsterdam Flames — and the vision driving us forward.",
  },
  {
    icon: IconWorld,
    title: "Social Impact",
    tagline: "Playing for Something Bigger",
    body: "See how sport can create opportunities, inspire young people and make a meaningful difference beyond the field.",
  },
  {
    icon: IconGavel,
    title: "Live Auction",
    tagline: "Bid. Win. Make an Impact.",
    body: "Get ready for an exciting auction featuring special experiences and exclusive items — all while supporting a great cause.",
  },
  {
    icon: IconMicrophone2,
    title: "Highlight Session",
    tagline: "Stories Behind the Stars",
    body: "A special on-stage moment featuring inspiring stories, memorable experiences and conversations that bring you closer to the people behind the game.",
  },
  {
    icon: IconStarFilled,
    title: "Meet the Legends",
    tagline: "Up Close with the Stars",
    body: "Meet celebrated players and sporting personalities, hear their stories and capture a few unforgettable moments.",
  },
  {
    icon: IconToolsKitchen2,
    title: "Dinner",
    tagline: "Dine. Connect. Celebrate.",
    body: "Enjoy a delicious dinner while sharing the evening with players, guests, partners and friends.",
  },
];

export default function AmsterdamFlamesNightOfStarsPage() {
  const [ticketTypes, setTicketTypes] = useState(null); // null = loading

  useEffect(() => {
    apiFetch(`/api/events/${EVENT_SLUG}`)
      .then((data) => setTicketTypes(data.event?.ticketTypes || []))
      .catch(() => setTicketTypes([]));
  }, []);

  return (
    <div className="af-event">
      <header className="af-event__topbar">
        <div className="af-event__logo">
          <img src={CREST_URL} alt="Amsterdam Flames crest" className="af-event__crest" />
          <span className="af-event__wordmark">
            <span className="af-event__wordmark-white">Amsterdam</span>
            <span className="af-event__wordmark-accent">Flames</span>
          </span>
        </div>
        <div className="af-event__topbar-info">
          <span className="af-event__topbar-tag">NIGHT OF STARS</span>
          <span className="af-event__topbar-meta">
            Sat, 5 Sep 2026 · 19:30 · Leonardo Hotel Den Haag Babylon
          </span>
        </div>
      </header>

      <section className="af-squad">
        <img
          src="/amsterdam-flames/squad-banner.png"
          alt="Amsterdam Flames squad — Night Of Stars"
          className="af-squad__banner"
        />
      </section>

      <section className="af-event__hero">
        <div className="af-event__hero-content">
          <p className="af-event__eyebrow">An Exclusive Evening</p>
          <h1 className="af-event__title">
            Amsterdam Flames:
            <br />
            <span className="af-event__title-accent">Night Of Stars</span>
          </h1>
          <p className="af-event__featuring">
            Featuring <span className="af-event__featuring-name">Steve Waugh</span>,{" "}
            <span className="af-event__featuring-name">Ajinkya Rahane</span> &amp;{" "}
            <span className="af-event__featuring-name">Jamie Dwyer</span>
          </p>
          <p className="af-event__tagline">
            Step into an evening where sport, style and celebration come together.
          </p>
          <p className="af-event__tagline">
            Join the Amsterdam Flames for an exclusive night of great food, inspiring company and unforgettable moments alongside some of the club&rsquo;s biggest names. Celebrate the passion, personalities and spirit that make the Flames more than a team — a community.
          </p>

          <section className="af-cause">
            <div className="af-cause__card">
              <img
                src="/amsterdam-flames/move-forward-logo.png"
                alt="Move Forward Foundation"
                className="af-cause__logo"
              />
              <div className="af-cause__content">
                <p className="af-cause__eyebrow">Move Forward × Night Of Stars</p>
                <p className="af-cause__lead">Turning movement into hope.</p>
                <p className="af-cause__body">
                  Through sport and dance, Move Forward Foundation helps children and young people affected by trauma rebuild confidence, connection and joy.
                </p>
                <p className="af-cause__body">
                  On 5 September, Night of Stars becomes a night of impact too — with a special fundraising moment supporting their mission.
                </p>
                <p className="af-cause__tagline">Move Together. Give Forward. Change Lives.</p>
              </div>
            </div>
          </section>

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
                <strong>19:30</strong>
              </div>
            </div>
            <div className="af-info-bar__item">
              <IconMapPin2 size={22} />
              <div>
                <span>Venue</span>
                <strong>Leonardo Hotel Den Haag Babylon</strong>
              </div>
            </div>
          </div>

          <section className="af-awaits">
            <p className="af-awaits__eyebrow">The Evening, In Full</p>
            <h2 className="af-awaits__title">What Awaits You at Night of Stars</h2>
            <AmsterdamFlamesAwaitsCarousel items={AWAITS} />
          </section>
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
              <strong>Time:</strong> 19:30 – 22:00
            </li>
            <li>
              <strong>Venue:</strong> Leonardo Hotel Den Haag Babylon, Bezuidenhoutseweg 53, 2595 AA Den Haag
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

          {ticketTypes === null ? (
            <p className="af-event__price-loading">Loading ticket options…</p>
          ) : ticketTypes.length ? (
            <div className="af-event__price-list">
              {ticketTypes.map((tt) => (
                <div key={tt.id} className="af-event__price-row">
                  <div className="af-event__price-row-info">
                    <p className="af-event__price-row-name">{tt.name}</p>
                    {tt.description ? <p className="af-event__price-row-desc">{tt.description}</p> : null}
                  </div>
                  <p className="af-event__price-row-amount">€{tt.price}</p>
                </div>
              ))}
            </div>
          ) : null}

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
        <p>
          <a href="https://stichtingthevoice.nl/voice-venture-studio" className="af-event__footer-link">
            Proudly Designed &amp; Developed By V.O.I.C.E. Venture Studio
          </a>
        </p>
        <p>&copy; 2026 Amsterdam Flames. All rights reserved.</p>
      </footer>
    </div>
  );
}
