import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa6";
import { apiFetch } from "../../utils/api.js";

function FormNotice({ message, variant = "success" }) {
  if (!message) return null;
  return (
    <p
      className={`volunteer-form__notice${variant === "error" ? " volunteer-form__notice--error" : ""}`}
      role="status"
    >
      {message}
    </p>
  );
}

export default function VolunteerForm() {
  const [status, setStatus] = useState({ text: "", variant: "success" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ text: "", variant: "success" });
    setSubmitting(true);

    try {
      const data = Object.fromEntries(new FormData(event.target).entries());
      await apiFetch("/api/contact/volunteer", {
        method: "POST",
        body: JSON.stringify(data)
      });
      setSubmitted(true);
    } catch (error) {
      setStatus({
        text: error.message || "Could not send your application. Please try again.",
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="volunteer-form__success" role="status">
        <p className="volunteer-form__success-message">
          Thank you! We have received your volunteer application and will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form className="volunteer-form" onSubmit={handleSubmit} noValidate>
      <div className="volunteer-form__row volunteer-form__row--split">
        <label className="volunteer-form__field">
          <span className="visually-hidden">Full name</span>
          <input
            type="text"
            name="name"
            placeholder="Full Name *"
            required
            autoComplete="name"
            disabled={submitting}
          />
        </label>
        <label className="volunteer-form__field">
          <span className="visually-hidden">Email address</span>
          <input
            type="email"
            name="email"
            placeholder="Email Address *"
            required
            autoComplete="email"
            disabled={submitting}
          />
        </label>
      </div>

      <label className="volunteer-form__field">
        <span className="visually-hidden">Phone number</span>
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number (optional)"
          autoComplete="tel"
          disabled={submitting}
        />
      </label>

      <label className="volunteer-form__field">
        <span className="visually-hidden">Your message</span>
        <textarea
          name="message"
          rows={6}
          placeholder="Tell us how you would like to help *"
          required
          disabled={submitting}
        />
      </label>

      <button type="submit" className="volunteer-form__submit" disabled={submitting}>
        <FaPaperPlane aria-hidden />
        {submitting ? "Sending…" : "Submit Application"}
      </button>

      <FormNotice message={status.text} variant={status.variant} />
    </form>
  );
}
