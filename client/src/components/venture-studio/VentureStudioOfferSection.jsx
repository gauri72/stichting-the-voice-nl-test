import "../../styles/venture-studio-offer-section.css";
import {
  FaBullhorn,
  FaChartLine,
  FaCode,
  FaComments,
  FaLightbulb,
  FaUserGraduate
} from "react-icons/fa6";

const OFFERS = [
  {
    icon: FaCode,
    title: "Website Development",
    text: "Modern, accessible websites tailored to your brand — built to engage audiences and drive growth."
  },
  {
    icon: FaBullhorn,
    title: "Marketing Strategies",
    text: "Data-informed campaigns and content plans that amplify your message across digital channels."
  },
  {
    icon: FaUserGraduate,
    title: "Onboarding & Support",
    text: "Smooth onboarding journeys for members, volunteers, and partners — with ongoing technical support."
  },
  {
    icon: FaChartLine,
    title: "Branding & Digital Growth",
    text: "Visual identity, social presence, and growth tactics that strengthen your organization online."
  },
  {
    icon: FaLightbulb,
    title: "Consultancy & Strategy",
    text: "Expert guidance on digital transformation, program design, and youth-focused initiatives."
  },
  {
    icon: FaComments,
    title: "Coaching & Mentorship",
    text: "One-on-one and group coaching that develops leadership, confidence, and career-ready skills."
  }
];

export default function VentureStudioOfferSection() {
  return (
    <section id="vvs-offer" className="vvs-offer" aria-labelledby="vvs-offer-heading">
      <div className="vvs-offer__inner">
        <header className="vvs-offer__header">
          <h2 id="vvs-offer-heading" className="vvs-section-title vvs-section-title--center">
            What We Offer
          </h2>
          <p className="vvs-section-sub vvs-section-sub--center">
            End-to-end digital solutions and youth empowerment services — designed to help you grow
            and make a lasting impact.
          </p>
        </header>
        <div className="vvs-offer__grid">
          {OFFERS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="vvs-offer__card">
              <span className="vvs-offer__icon" aria-hidden>
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
