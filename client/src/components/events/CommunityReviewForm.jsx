import { useState } from "react";
import { IconMessage, IconSend, IconStar, IconStarFilled, IconUser } from "@tabler/icons-react";
import CaptchaField from "../common/CaptchaField.jsx";
import { useCaptcha } from "../../hooks/useCaptcha.js";
import { CAPTCHA_REQUIRED_MESSAGE } from "../../utils/captcha.js";
import { saveEventTestimonial, getInitials } from "../../utils/eventsTestimonials.js";

function StarRating({ value, onChange }) {
  return (
    <div className="crs-form__stars" role="group" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            className={`crs-form__star-btn${active ? " is-active" : ""}`}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} out of 5 stars`}
            aria-pressed={active}
          >
            {active ? <IconStarFilled size={22} stroke={1.5} aria-hidden /> : <IconStar size={22} stroke={1.75} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

export default function CommunityReviewForm({ onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState({ text: "", variant: "success" });
  const [submitting, setSubmitting] = useState(false);
  const captcha = useCaptcha();

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ text: "", variant: "success" });

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const name = data.name?.toString().trim() ?? "";
    const quote = data.testimonial?.toString().trim() ?? "";
    const eventName = data.eventName?.toString().trim() ?? "";
    const consent = data.consent === "on" || data.consent === "true";

    if (!name) {
      setStatus({ text: "Please enter your name.", variant: "error" });
      return;
    }
    if (rating < 1) {
      setStatus({ text: "Please select a star rating.", variant: "error" });
      return;
    }
    if (!quote) {
      setStatus({ text: "Please share your review.", variant: "error" });
      return;
    }
    if (!consent) {
      setStatus({ text: "Please accept the consent checkbox.", variant: "error" });
      return;
    }
    if (captcha.required && !captcha.token) {
      setStatus({ text: CAPTCHA_REQUIRED_MESSAGE, variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await saveEventTestimonial({
        name,
        role: "Community Member",
        quote,
        rating,
        initials: getInitials(name),
        eventName,
        consentAccepted: consent,
        captchaToken: captcha.token,
      });

      setStatus({
        text:
          result?.message ||
          "Thank you for sharing your experience. Your review will be visible after moderation.",
        variant: "success",
      });
      form.reset();
      setRating(0);
      onSubmitted?.();
    } catch (err) {
      setStatus({ text: err.message || "Could not submit your review. Please try again.", variant: "error" });
    } finally {
      captcha.reset();
      setSubmitting(false);
    }
  }

  return (
    <div className="crs-form">
      <header className="crs-form__header">
        <p className="crs-form__eyebrow">Share Your Experience</p>
        <h3 className="crs-form__title">Rate V.O.I.C.E. NL</h3>
        <p className="crs-form__lead">Your feedback helps us create better cultural experiences.</p>
      </header>

      <form className="crs-form__grid" onSubmit={handleSubmit} noValidate>
        <label className="crs-form__field">
          <span className="crs-form__label"><IconUser size={16} aria-hidden /> Your Name</span>
          <input type="text" name="name" placeholder="Enter your name" autoComplete="name" disabled={submitting} required />
        </label>

        <div className="crs-form__field">
          <span className="crs-form__label"><IconStar size={16} aria-hidden /> Your Rating</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <label className="crs-form__field crs-form__field--full">
          <span className="crs-form__label"><IconMessage size={16} aria-hidden /> Your Review</span>
          <textarea
            name="testimonial"
            rows={4}
            placeholder="Share your experience with V.O.I.C.E. NL..."
            disabled={submitting}
            required
          />
        </label>

        <label className="crs-form__field crs-form__field--full">
          <span className="crs-form__label">Event attended (optional)</span>
          <input type="text" name="eventName" placeholder="e.g. Couples Night, HerBeats HerNight" disabled={submitting} />
        </label>

        <label className="crs-form__consent crs-form__field--full">
          <input type="checkbox" name="consent" disabled={submitting} required />
          <span>I consent to my review being published after moderation.</span>
        </label>

        {status.text ? (
          <p className={`crs-form__status crs-form__status--${status.variant}`} role="status">{status.text}</p>
        ) : null}

        <CaptchaField captcha={captcha} className="crs-form__field--full" />

        <button className="crs-form__submit" type="submit" disabled={submitting}>
          <IconSend size={18} aria-hidden stroke={1.75} />
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
