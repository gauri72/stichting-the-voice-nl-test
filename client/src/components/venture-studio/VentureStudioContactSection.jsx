import { useState } from "react";
import "../../styles/venture-studio-contact-section.css";
import {
  FaChevronRight,
  FaClock,
  FaEnvelope,
  FaLocationDot,
  FaPaperPlane,
  FaPhone
} from "react-icons/fa6";
import { apiFetch } from "../../utils/api.js";

const CONTACT = {
  emails: [
    { label: "info@voice-nl.com", href: "mailto:info@voice-nl.com" },
    { label: "support@voice-nl.com", href: "mailto:support@voice-nl.com" }
  ],
  phone: "+31 6 12345678",
  phoneHref: "tel:+31612345678",
  location: "The Netherlands",
  hoursLine1: "Monday – Friday",
  hoursLine2: "9:00 AM – 6:00 PM (CET)"
};

const SERVICE_OPTIONS = [
  "Website Development",
  "Marketing Strategies",
  "Onboarding & Support",
  "Branding & Digital Growth",
  "Consultancy & Strategy",
  "Coaching & Mentorship",
  "Other"
];

function FormNotice({ message, variant = "success" }) {
  if (!message) return null;
  return (
    <p
      className={`vvs-contact__notice${variant === "error" ? " vvs-contact__notice--error" : ""}`}
      role="status"
    >
      {message}
    </p>
  );
}

function formDataFromForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export default function VentureStudioContactSection() {
  const [messageStatus, setMessageStatus] = useState({ text: "", variant: "success" });
  const [quoteStatus, setQuoteStatus] = useState({ text: "", variant: "success" });
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  async function handleMessageSubmit(e) {
    e.preventDefault();
    setMessageStatus({ text: "", variant: "success" });
    setMessageSubmitting(true);

    try {
      const data = formDataFromForm(e.target);
      const result = await apiFetch("/api/contact/venture-studio/message", {
        method: "POST",
        body: JSON.stringify(data)
      });
      setMessageStatus({ text: result.message, variant: "success" });
      e.target.reset();
    } catch (error) {
      setMessageStatus({
        text: error.message || "Could not send your message. Please try again.",
        variant: "error"
      });
    } finally {
      setMessageSubmitting(false);
    }
  }

  async function handleQuoteSubmit(e) {
    e.preventDefault();
    setQuoteStatus({ text: "", variant: "success" });
    setQuoteSubmitting(true);

    try {
      const data = formDataFromForm(e.target);
      const result = await apiFetch("/api/contact/venture-studio/quote", {
        method: "POST",
        body: JSON.stringify(data)
      });
      setQuoteStatus({ text: result.message, variant: "success" });
      e.target.reset();
    } catch (error) {
      setQuoteStatus({
        text: error.message || "Could not send your quote request. Please try again.",
        variant: "error"
      });
    } finally {
      setQuoteSubmitting(false);
    }
  }

  return (
    <section id="vvs-contact" className="vvs-contact" aria-labelledby="vvs-contact-heading">
      <div className="vvs-contact__inner">
        <h2 id="vvs-contact-heading" className="vvs-visually-hidden">
          Contact &amp; service requests
        </h2>

        <div className="vvs-contact__grid">
          <div className="vvs-contact__card vvs-contact__card--info">
            <h3 className="vvs-contact__card-title">Contact Information</h3>
            <ul className="vvs-contact__info-list">
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaEnvelope />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>Email Us</strong>
                  {CONTACT.emails.map(({ label, href }) => (
                    <a key={label} href={href}>
                      {label}
                    </a>
                  ))}
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaPhone />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>Call Us</strong>
                  <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaLocationDot />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>Our Location</strong>
                  <span>{CONTACT.location}</span>
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaClock />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>Office Hours</strong>
                  <span>{CONTACT.hoursLine1}</span>
                  <span>{CONTACT.hoursLine2}</span>
                </div>
              </li>
            </ul>
          </div>

          <form
            className="vvs-contact__card vvs-contact__card--form"
            onSubmit={handleMessageSubmit}
            noValidate
          >
            <h3 className="vvs-contact__card-title">Send Us a Message</h3>
            <div className="vvs-contact__row vvs-contact__row--split">
              <label className="vvs-contact__field">
                <span className="vvs-visually-hidden">Full Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name *"
                  required
                  autoComplete="name"
                  disabled={messageSubmitting}
                />
              </label>
              <label className="vvs-contact__field">
                <span className="vvs-visually-hidden">Email Address</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  required
                  autoComplete="email"
                  disabled={messageSubmitting}
                />
              </label>
            </div>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">Subject</span>
              <input
                type="text"
                name="subject"
                placeholder="Subject *"
                required
                disabled={messageSubmitting}
              />
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">Your Message / Question</span>
              <textarea
                name="message"
                rows={5}
                placeholder="Your Message / Question *"
                required
                disabled={messageSubmitting}
              />
            </label>
            <button type="submit" className="vvs-contact__btn" disabled={messageSubmitting}>
              <FaPaperPlane aria-hidden />
              {messageSubmitting ? "Sending…" : "Send Message"}
            </button>
            <FormNotice message={messageStatus.text} variant={messageStatus.variant} />
          </form>

          <form
            className="vvs-contact__card vvs-contact__card--form vvs-contact__card--quote"
            onSubmit={handleQuoteSubmit}
            noValidate
          >
            <h3 className="vvs-contact__card-title">Request Our Services</h3>
            <p className="vvs-contact__card-lead">
              Tell us about your project and our team will get back to you with the best
              solution.
            </p>
            <label className="vvs-contact__field vvs-contact__field--select">
              <span className="vvs-visually-hidden">I need help with</span>
              <select name="service" required defaultValue="" disabled={quoteSubmitting}>
                <option value="" disabled>
                  I need help with *
                </option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">Project Type / Industry</span>
              <input
                type="text"
                name="projectType"
                placeholder="Project Type / Industry"
                disabled={quoteSubmitting}
              />
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">Timeline</span>
              <input
                type="text"
                name="timeline"
                placeholder="Timeline (Optional)"
                disabled={quoteSubmitting}
              />
            </label>
            <label className="vvs-contact__field">
              <span className="vvs-visually-hidden">Project details</span>
              <textarea
                name="details"
                rows={5}
                placeholder="Tell us more about your project..."
                required
                disabled={quoteSubmitting}
              />
            </label>
            <button type="submit" className="vvs-contact__btn" disabled={quoteSubmitting}>
              {quoteSubmitting ? "Sending…" : "Request a Quote"}
              {!quoteSubmitting && <FaChevronRight aria-hidden />}
            </button>
            <FormNotice message={quoteStatus.text} variant={quoteStatus.variant} />
          </form>
        </div>
      </div>
    </section>
  );
}
