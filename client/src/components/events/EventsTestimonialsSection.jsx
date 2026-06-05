import { useState } from "react";
import {
  IconMessage,
  IconSend,
  IconShieldCheck,
  IconStar,
  IconStarFilled,
  IconUser,
} from "@tabler/icons-react";
import testimonialsBgLight from "../../assets/Events/testimonials-bg-light.png";
import testimonialsBgDark from "../../assets/Events/testimonials-bg-dark.png";
import "../../styles/events-testimonials-section.css";

function VoiceBrandTitle() {
  return (
    <span className="events-reviews__brand" aria-label="V.O.I.C.E. NL">
      <span className="events-reviews__brand-vo">
        V<span className="events-reviews__brand-dot">.</span>O
        <span className="events-reviews__brand-dot">.</span>
      </span>
      <span className="events-reviews__brand-ice">
        I<span className="events-reviews__brand-dot">.</span>C<span className="events-reviews__brand-dot">.</span>E
      </span>
      <span className="events-reviews__brand-nl"> NL</span>
    </span>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="events-reviews__stars" role="group" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            className={`events-reviews__star-btn${active ? " is-active" : ""}`}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} out of 5 stars`}
            aria-pressed={active}
          >
            {active ? (
              <IconStarFilled className="events-reviews__star-icon" aria-hidden stroke={1.5} />
            ) : (
              <IconStar className="events-reviews__star-icon" aria-hidden stroke={1.75} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function CardStars({ count = 5 }) {
  return (
    <div className="events-reviews__card-stars" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <IconStarFilled key={i} className="events-reviews__card-star" stroke={1.5} />
      ))}
    </div>
  );
}

export function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function CommunityBlock({ testimonials }) {
  return (
    <div className="events-reviews__community">
      <div className="events-reviews__community-heading">
        <span className="events-reviews__community-line" aria-hidden="true" />
        <h3 id="events-community-title" className="events-reviews__community-title">
          What Our Community Says
        </h3>
        <span className="events-reviews__community-line" aria-hidden="true" />
      </div>

      {testimonials.length > 0 ? (
        <div className="events-reviews__cards" role="list">
          {testimonials.map(({ id, name, role, quote, rating: cardRating, initials }) => (
            <article key={id} className="events-reviews__card" role="listitem">
              <CardStars count={cardRating} />
              <p className="events-reviews__card-quote">
                <span className="events-reviews__card-quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                {quote}
              </p>
              <footer className="events-reviews__card-author">
                <span
                  className="events-reviews__card-avatar events-reviews__card-avatar--initials"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <div>
                  <p className="events-reviews__card-name">{name}</p>
                  <p className="events-reviews__card-role">{role}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      ) : null}

      <p className="events-reviews__moderation">
        <IconShieldCheck className="events-reviews__moderation-icon" aria-hidden stroke={1.75} />
        All reviews are moderated to ensure authenticity and maintain a positive community
        environment.
      </p>
    </div>
  );
}

function SubmitBlock({ onAddTestimonial }) {
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState({ text: "", variant: "success" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ text: "", variant: "success" });

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const name = data.name?.toString().trim() ?? "";
    const quote = data.testimonial?.toString().trim() ?? "";

    if (!name) {
      setStatus({ text: "Please enter your name.", variant: "error" });
      return;
    }
    if (rating < 1) {
      setStatus({ text: "Please select a star rating.", variant: "error" });
      return;
    }
    if (!quote) {
      setStatus({ text: "Please share your testimonial.", variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await onAddTestimonial({
        name,
        role: "Community Member",
        quote,
        rating,
        initials: getInitials(name),
      });

      setStatus({
        text: "Thank you! Your review has been added to our community.",
        variant: "success",
      });
      form.reset();
      setRating(0);
    } catch {
      setStatus({ text: "Could not submit your review. Please try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="events-reviews__rate">
      <header className="events-reviews__header">
        <p className="events-reviews__eyebrow">Share Your Experience</p>
        <h2 id="events-reviews-title" className="events-reviews__title">
          Rate <VoiceBrandTitle />
        </h2>
        <p className="events-reviews__lead">
          Your feedback helps us create better cultural experiences.
        </p>
      </header>

      <div className="events-reviews__rate-row">
        <form className="events-reviews__form" onSubmit={handleSubmit} noValidate>
          <label className="events-reviews__field">
            <span className="events-reviews__field-label">
              <IconUser className="events-reviews__label-icon" aria-hidden stroke={1.75} />
              Your Name
            </span>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              autoComplete="name"
              disabled={submitting}
              required
            />
          </label>

          <div className="events-reviews__field">
            <span className="events-reviews__field-label">
              <IconStar className="events-reviews__label-icon" aria-hidden stroke={1.75} />
              Your Rating
            </span>
            <StarRating value={rating} onChange={setRating} />
            <input type="hidden" name="rating" value={rating > 0 ? String(rating) : ""} />
            <p className="events-reviews__stars-hint">Click on a star to rate</p>
          </div>

          <label className="events-reviews__field">
            <span className="events-reviews__field-label">
              <IconMessage className="events-reviews__label-icon" aria-hidden stroke={1.75} />
              Your Testimonial
            </span>
            <textarea
              name="testimonial"
              rows={4}
              placeholder="Share your experience with V.O.I.C.E. NL..."
              disabled={submitting}
              required
            />
          </label>

          {status.text ? (
            <p
              className={`events-reviews__form-status events-reviews__form-status--${status.variant}`}
              role="status"
            >
              {status.text}
            </p>
          ) : null}

          <button className="events-reviews__submit" type="submit" disabled={submitting}>
            <IconSend className="events-reviews__submit-icon" aria-hidden stroke={1.75} />
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        <aside className="events-reviews__inspire" aria-label="Thank you message">
          <span className="events-reviews__inspire-icon-wrap" aria-hidden="true">
            <IconStar className="events-reviews__inspire-icon" stroke={2} fill="none" />
          </span>
          <h3 className="events-reviews__inspire-title">Your words inspire us</h3>
          <p className="events-reviews__inspire-text">
            Thank you for being a part of our journey and helping our community grow.
          </p>
        </aside>
      </div>
    </div>
  );
}

/**
 * @param {{ variant: "community" | "submit", testimonials: Array, onAddTestimonial?: (entry: object) => void }} props
 */
export default function EventsTestimonialsSection({ variant, testimonials, onAddTestimonial }) {
  if (variant === "community") {
    return (
      <section
        className="events-reviews events-reviews--community"
        aria-labelledby="events-community-title"
      >
        <div className="events-reviews__community-shell">
          <CommunityBlock testimonials={testimonials} />
        </div>
      </section>
    );
  }

  return (
    <section className="events-reviews events-reviews--submit" aria-labelledby="events-reviews-title">
      <div className="events-reviews__frame">
        <img
          className="events-reviews__bg events-reviews__bg--light"
          src={testimonialsBgLight}
          alt=""
          decoding="async"
        />
        <img
          className="events-reviews__bg events-reviews__bg--dark"
          src={testimonialsBgDark}
          alt=""
          decoding="async"
        />

        <div className="events-reviews__inner">
          <SubmitBlock onAddTestimonial={onAddTestimonial} />
        </div>
      </div>
    </section>
  );
}
