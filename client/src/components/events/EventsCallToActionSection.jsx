import { Link } from "react-router-dom";
import { IconHeart, IconHeartHandshake, IconUsersGroup } from "@tabler/icons-react";
import {
  FaCalendarCheck,
  FaHandshake,
  FaMicrophone,
  FaUsers,
} from "react-icons/fa6";
import { sponsorPartnerCount } from "../../data/sponsorLogos.js";
import eventsBg from "../../assets/Events/events-bg.png";
import "../../styles/events-call-to-action-section.css";

const journeyStats = [
  { icon: FaCalendarCheck, value: "10+", label: "Events Hosted" },
  { icon: FaUsers, value: "3K+", label: "Attendees Reached" },
  { icon: FaHandshake, value: `${sponsorPartnerCount}+`, label: "Partners" },
  { icon: FaMicrophone, value: "125+", label: "Artists Amplified" },
];

export default function EventsCallToActionSection() {
  return (
    <section className="events-cta" aria-labelledby="events-cta-journey-title">
      <div className="events-cta__frame">
        <img className="events-cta__bg" src={eventsBg} alt="" decoding="async" />
        <div className="events-cta__inner">
          <div className="events-cta__journey">
            <h2 id="events-cta-journey-title" className="events-cta__journey-title">
              Our Event Journey
            </h2>
            <p className="events-cta__impact-heading">Our Impact</p>
            <p className="events-cta__journey-text">
              Together, we create more than events – we build a stronger, more connected society.
            </p>
          </div>

          <div className="events-cta__stats" role="group" aria-label="Our event impact">
            {journeyStats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="events-cta__stats-col">
                <div className="events-cta__stats-cell events-cta__stats-cell--icon">
                  <span className="events-cta__stat-icon" aria-hidden="true">
                    <Icon />
                  </span>
                </div>
                <div className="events-cta__stats-cell events-cta__stats-cell--value">
                  <p className="events-cta__stat-value">{value}</p>
                </div>
                <div className="events-cta__stats-cell events-cta__stats-cell--label">
                  <p className="events-cta__stat-label">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="events-cta__future">
            <h3 className="events-cta__future-title">Be Part of Our Future</h3>
            <p className="events-cta__future-text">
              Join us in creating more unforgettable experiences and greater impact.
            </p>
            <div className="events-cta__actions">
              <Link className="events-cta__btn events-cta__btn--outline" to="/membership">
                <IconUsersGroup className="events-cta__btn-icon" aria-hidden stroke={1.75} />
                Become a Member
              </Link>
              <div className="events-cta__actions-row">
                <Link className="events-cta__btn events-cta__btn--outline" to="/sponsorship">
                  <IconHeartHandshake className="events-cta__btn-icon" aria-hidden stroke={1.75} />
                  Sponsor Us
                </Link>
                <Link className="events-cta__btn events-cta__btn--outline" to="/donate">
                  <IconHeart className="events-cta__btn-icon" aria-hidden stroke={1.75} />
                  Donate Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
