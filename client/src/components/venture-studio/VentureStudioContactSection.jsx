import { useState } from "react";
import "../../styles/venture-studio-contact-section.css";
import {
  FaArrowRightLong,
  FaClock,
  FaEnvelope,
  FaLocationDot,
  FaPhone
} from "react-icons/fa6";

const DEFAULT_EMAIL = "info@stichtingthevoice.nl";
const DEFAULT_PHONE = "+31 6 19032104";
const DEFAULT_LOCATION = "Netherlands";
const DEFAULT_HOURS = "Mon – Fri, 9:00 – 17:00 CET";

const SERVICE_OPTIONS = [
  "Website Development",
  "Marketing Strategies",
  "Onboarding & Support",
  "Branding & Digital Growth",
  "Consultancy & Strategy",
  "Coaching & Mentorship",
  "Other"
];

const PROJECT_TYPES = [
  "Non-profit / Foundation",
  "Education",
  "Events & Culture",
  "Corporate / Business",
  "Startup",
  "Other"
];

const TIMELINES = [
  "As soon as possible",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Flexible / Not sure"
];

function FormNotice({ message }) {
  if (!message) return null;
  return <p className="vvs-contact__notice">{message}</p>;
}

export default function VentureStudioContactSection() {
  const [messageStatus, setMessageStatus] = useState("");
  const [quoteStatus, setQuoteStatus] = useState("");

  function handleMessageSubmit(e) {
    e.preventDefault();
    setMessageStatus("Thank you! We will get back to you shortly.");
    e.target.reset();
  }

  function handleQuoteSubmit(e) {
    e.preventDefault();
    setQuoteStatus("Thank you! Your quote request has been received.");
    e.target.reset();
  }

  return (
    <section id="vvs-contact" className="vvs-contact" aria-labelledby="vvs-contact-heading">
      <div className="vvs-contact__inner">
        <h2 id="vvs-contact-heading" className="vvs-visually-hidden">
          Contact &amp; service requests
        </h2>
        <div className="vvs-contact__grid">
          <div className="vvs-contact__info">
            <h3>Contact Information</h3>
            <ul>
              <li>
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaEnvelope />
                </span>
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${DEFAULT_EMAIL}`}>{DEFAULT_EMAIL}</a>
                </div>
              </li>
              <li>
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaPhone />
                </span>
                <div>
                  <strong>Call Us</strong>
                  <a href="tel:+31619032104">{DEFAULT_PHONE}</a>
                </div>
              </li>
              <li>
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaLocationDot />
                </span>
                <div>
                  <strong>Our Location</strong>
                  <span>{DEFAULT_LOCATION}</span>
                </div>
              </li>
              <li>
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaClock />
                </span>
                <div>
                  <strong>Office Hours</strong>
                  <span>{DEFAULT_HOURS}</span>
                </div>
              </li>
            </ul>
          </div>

          <form className="vvs-contact__form" onSubmit={handleMessageSubmit}>
            <h3>Send Us a Message</h3>
            <label>
              Full Name
              <input type="text" name="name" required autoComplete="name" />
            </label>
            <label>
              Email Address
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label>
              Subject
              <input type="text" name="subject" required />
            </label>
            <label>
              Message
              <textarea name="message" rows={4} required />
            </label>
            <button type="submit" className="vvs-btn vvs-btn--primary vvs-btn--block">
              Send Message
            </button>
            <FormNotice message={messageStatus} />
          </form>

          <form className="vvs-contact__form vvs-contact__form--quote" onSubmit={handleQuoteSubmit}>
            <h3>Request Our Services</h3>
            <label>
              I need help with...
              <select name="service" required defaultValue="">
                <option value="" disabled>
                  Select a service
                </option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Project Type / Industry
              <select name="projectType" required defaultValue="">
                <option value="" disabled>
                  Select project type
                </option>
                {PROJECT_TYPES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Timeline (Optional)
              <select name="timeline" defaultValue="">
                <option value="">Select timeline</option>
                {TIMELINES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tell us about your project
              <textarea name="details" rows={4} required />
            </label>
            <button type="submit" className="vvs-btn vvs-btn--primary vvs-btn--block">
              Request a Quote
              <FaArrowRightLong aria-hidden />
            </button>
            <FormNotice message={quoteStatus} />
          </form>
        </div>
      </div>
    </section>
  );
}
