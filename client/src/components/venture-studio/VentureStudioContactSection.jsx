import { useEffect, useState } from "react";
import "../../styles/venture-studio-contact-section.css";
import {
  FaBuilding,
  FaChevronRight,
  FaEnvelope,
  FaLocationDot,
  FaPaperPlane,
  FaPhone
} from "react-icons/fa6";
import { apiFetch } from "../../utils/api.js";
import { useCaptcha } from "../../hooks/useCaptcha.js";
import { CAPTCHA_REQUIRED_MESSAGE } from "../../utils/captcha.js";
import CaptchaField from "../common/CaptchaField.jsx";

const DEFAULT_CONTACT_EMAIL = "info@stichtingthevoice.nl";

const CONTACT = {
  phone: "+31 6 19032104",
  phoneHref: "tel:+31619032104",
  addressLines: ["Wengehout 30,", "2719 KA Zoetermeer,", "The Netherlands"],
  kvk: "92180213"
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
  const [contactEmail, setContactEmail] = useState(DEFAULT_CONTACT_EMAIL);
  const [messageStatus, setMessageStatus] = useState({ text: "", variant: "success" });
  const [quoteStatus, setQuoteStatus] = useState({ text: "", variant: "success" });
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const messageCaptcha = useCaptcha();
  const quoteCaptcha = useCaptcha();

  useEffect(() => {
    apiFetch("/api/public/site")
      .then((data) => {
        if (data?.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, []);

  async function handleMessageSubmit(e) {
    e.preventDefault();
    setMessageStatus({ text: "", variant: "success" });

    if (messageCaptcha.required && !messageCaptcha.token) {
      setMessageStatus({ text: CAPTCHA_REQUIRED_MESSAGE, variant: "error" });
      return;
    }

    setMessageSubmitting(true);

    try {
      const data = formDataFromForm(e.target);
      const result = await apiFetch("/api/contact/venture-studio/message", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          captchaToken: messageCaptcha.token
        })
      });
      setMessageStatus({ text: result.message, variant: "success" });
      e.target.reset();
    } catch (error) {
      setMessageStatus({
        text: error.message || "Could not send your message. Please try again.",
        variant: "error"
      });
    } finally {
      messageCaptcha.reset();
      setMessageSubmitting(false);
    }
  }

  async function handleQuoteSubmit(e) {
    e.preventDefault();
    setQuoteStatus({ text: "", variant: "success" });

    if (quoteCaptcha.required && !quoteCaptcha.token) {
      setQuoteStatus({ text: CAPTCHA_REQUIRED_MESSAGE, variant: "error" });
      return;
    }

    setQuoteSubmitting(true);

    try {
      const data = formDataFromForm(e.target);
      const result = await apiFetch("/api/contact/venture-studio/quote", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          captchaToken: quoteCaptcha.token
        })
      });
      setQuoteStatus({ text: result.message, variant: "success" });
      e.target.reset();
    } catch (error) {
      setQuoteStatus({
        text: error.message || "Could not send your quote request. Please try again.",
        variant: "error"
      });
    } finally {
      quoteCaptcha.reset();
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
                  <strong>Email</strong>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaPhone />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>Office Phone</strong>
                  <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaLocationDot />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>Address</strong>
                  {CONTACT.addressLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </li>
              <li className="vvs-contact__info-item">
                <span className="vvs-contact__info-icon" aria-hidden>
                  <FaBuilding />
                </span>
                <div className="vvs-contact__info-body">
                  <strong>KVK</strong>
                  <span>{CONTACT.kvk}</span>
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
            <CaptchaField captcha={messageCaptcha} className="vvs-contact__captcha" />
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
            <CaptchaField captcha={quoteCaptcha} className="vvs-contact__captcha" />
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
