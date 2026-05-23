import { Link } from "react-router-dom";
import "../../styles/venture-studio-support-section.css";
import {
  FaBullhorn,
  FaCalendarCheck,
  FaHandshake,
  FaHeart,
  FaUser
} from "react-icons/fa6";

const SUPPORT_ITEMS = [
  {
    icon: FaUser,
    title: "Become a Member",
    text: "Join our community and access events, mentorship, and opportunities built for youth growth.",
    to: "/membership"
  },
  {
    icon: FaHandshake,
    title: "Offer Sponsorship",
    text: "Partner with us to fund programs, events, and initiatives that empower the next generation.",
    to: "/sponsorship"
  },
  {
    icon: FaHeart,
    title: "Make a Donation",
    text: "Every contribution helps us create internships, projects, and learning experiences for young people.",
    to: "/donate"
  },
  {
    icon: FaCalendarCheck,
    title: "Join & Support Our Events",
    text: "Attend, volunteer, or promote our signature events that celebrate culture, talent, and community.",
    to: "/events"
  },
  {
    icon: FaBullhorn,
    title: "Refer Us",
    text: "Spread the word — connect us with organizations, sponsors, or youth who can benefit from our mission.",
    href: "#vvs-contact"
  }
];

export default function VentureStudioSupportSection() {
  return (
    <section className="vvs-support" aria-labelledby="vvs-support-heading">
      <div className="vvs-support__inner">
        <header className="vvs-support__header">
          <h2 id="vvs-support-heading" className="vvs-section-title vvs-section-title--center">
            How You Can <span>Support</span> This Cause
          </h2>
          <p className="vvs-section-sub vvs-section-sub--center">
            Every action — big or small — helps us build futures for youth and strengthen the
            communities we serve.
          </p>
        </header>
        <div className="vvs-support__grid">
          {SUPPORT_ITEMS.map(({ icon: Icon, title, text, to, href }) => {
            const content = (
              <>
                <span className="vvs-support__icon" aria-hidden>
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </>
            );
            if (to) {
              return (
                <Link key={title} className="vvs-support__card" to={to}>
                  {content}
                </Link>
              );
            }
            return (
              <a key={title} className="vvs-support__card" href={href}>
                {content}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
