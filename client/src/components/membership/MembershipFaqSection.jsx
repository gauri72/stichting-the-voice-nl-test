import { useState } from "react";
import {
  FaCreditCard,
  FaExchangeAlt,
  FaHandshake,
  FaMinus,
  FaPlus,
  FaTicketAlt,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa";
import "../../styles/membership-faq-section.css";

const faqs = [
  {
    id: "upgrade",
    Icon: FaCreditCard,
    question: "What if I already have a Privileged Membership and want to upgrade to Premium?",
    answer:
      "If you hold a valid membership before February 1, 2025, you will receive a €15 discount code via email on your registered mail account. This can be used to upgrade to a Premium Loyalty Membership. If not received, please connect with us via any social media channels and we will be happy to help you.",
  },
  {
    id: "events",
    Icon: FaTicketAlt,
    question: "If I buy a Premium Membership partway through the year, how do event discounts apply?",
    answer:
      "Your membership is valid for the stated period. Discounts on all events within that validity period apply from your purchase date according to your plan (see the membership matrix for Premium vs Privileged benefits).",
  },
  {
    id: "attend",
    Icon: FaUser,
    question: "What if I cannot attend an event? Is my ticket transferable?",
    answer:
      "If you are unable to attend an event, please contact us at info@stichtingthevoice.nl. We will be happy to assist you.",
  },
  {
    id: "transfer",
    Icon: FaExchangeAlt,
    question: "Can I transfer my membership to another person?",
    answer: "No, memberships are non-transferable and cannot be assigned to another individual.",
  },
  {
    id: "offers",
    Icon: FaHandshake,
    question: "What are Sponsor Offers?",
    answer:
      "Our sponsors provide exclusive deals and discounts throughout the year, which will be shared with members via our WhatsApp group.",
  },
];

export default function MembershipFaqSection() {
  const [openId, setOpenId] = useState(faqs[0].id);

  function toggleFaq(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section id="membership-faqs" className="membership-faq" aria-labelledby="membership-faq-title">
      <div className="membership-faq__container">
        <div className="membership-faq__heading">
          <span className="membership-faq__heading-line" aria-hidden="true" />
          <h2 id="membership-faq-title" className="membership-faq__title">
            Frequently Asked Questions
          </h2>
          <span className="membership-faq__heading-line" aria-hidden="true" />
        </div>

        <div className="membership-faq__list">
          {faqs.map(({ id, Icon, question, answer }) => (
            <article key={id} className={`membership-faq__item ${openId === id ? "is-open" : ""}`}>
              <button
                type="button"
                className="membership-faq__trigger"
                onClick={() => toggleFaq(id)}
                aria-expanded={openId === id}
                aria-controls={`faq-panel-${id}`}
              >
                <span className="membership-faq__question-wrap">
                  <span className="membership-faq__question-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="membership-faq__question-text">{question}</span>
                </span>
                <span className="membership-faq__toggle-icon" aria-hidden="true">
                  {openId === id ? <FaMinus /> : <FaPlus />}
                </span>
              </button>

              <div id={`faq-panel-${id}`} className="membership-faq__panel" role="region" aria-live="polite">
                <p>
                  {answer.includes("info@stichtingthevoice.nl") ? (
                    <>
                      If you are unable to attend an event, please contact us at{" "}
                      <a href="mailto:info@stichtingthevoice.nl">info@stichtingthevoice.nl</a>. We will be happy
                      to assist you.
                    </>
                  ) : (
                    answer
                  )}
                </p>
              </div>
            </article>
          ))}
        </div>

        <aside className="membership-faq__cta" aria-label="Questions help card">
          <p className="membership-faq__cta-title">Still have questions?</p>
          <p>We are here to help you choose the right membership.</p>
          <div className="membership-faq__cta-actions">
            <a href="mailto:info@stichtingthevoice.nl?subject=Membership%20enquiry">Contact us</a>
            <a href="https://wa.me/31619032104" target="_blank" rel="noreferrer">
              <FaWhatsapp aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
