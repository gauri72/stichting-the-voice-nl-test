import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconArrowRight, IconStarFilled } from "@tabler/icons-react";
import { apiFetch } from "../../utils/api.js";
import { useAutoAdvance } from "../../hooks/useAutoAdvance.js";
import CommunityReviewModal from "./CommunityReviewModal.jsx";
import CommunityReviewForm from "./CommunityReviewForm.jsx";
import "../../styles/community-reviews-slider.css";

const AUTO_SCROLL_MS = 8000;
const SCROLL_STEP = 280;

function previewText(text, max = 120) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function CardStars({ count = 5 }) {
  return (
    <div className="crs-slider__stars" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <IconStarFilled key={i} className="crs-slider__star" stroke={1.5} />
      ))}
    </div>
  );
}

export default function CommunityReviewsSlider({ onReviewsLoaded }) {
  const { t } = useTranslation(["events"]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch("/api/public/reviews")
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data.reviews) ? data.reviews : data.testimonials || [];
        setReviews(items);
        onReviewsLoaded?.(items);
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onReviewsLoaded]);

  const scrollBy = useCallback((delta) => {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const scrollNext = useCallback(() => scrollBy(SCROLL_STEP), [scrollBy]);
  const scrollPrev = useCallback(() => scrollBy(-SCROLL_STEP), [scrollBy]);

  useAutoAdvance(scrollNext, { enabled: reviews.length > 1 && !isPaused, intervalMs: AUTO_SCROLL_MS });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    function onScroll() {
      const cardWidth = track.firstElementChild?.getBoundingClientRect().width || SCROLL_STEP;
      const index = Math.round(track.scrollLeft / (cardWidth + 14));
      setActiveDot(Math.max(0, Math.min(index, reviews.length - 1)));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [reviews.length]);

  return (
    <section
      id="events-community-reviews"
      className="crs-slider"
      aria-labelledby="crs-slider-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="crs-slider__inner">
        <header className="crs-slider__header">
          <h2 id="crs-slider-title" className="crs-slider__title">
            {t("events:reviewsSlider.title")}
          </h2>
          <p className="crs-slider__subtitle">
            {t("events:reviewsSlider.subtitle")}
          </p>
        </header>

        {loading ? (
          <p className="crs-slider__status" role="status">{t("events:reviewsSlider.loading")}</p>
        ) : null}

        {!loading && reviews.length === 0 ? (
          <div className="crs-slider__empty">
            <p>{t("events:reviewsSlider.emptyState")}</p>
            <button type="button" className="crs-slider__cta" onClick={() => setFormOpen(true)}>
              {t("events:reviewsSlider.shareExperience")}
            </button>
          </div>
        ) : null}

        {!loading && reviews.length > 0 ? (
          <div className="crs-slider__carousel" aria-roledescription="carousel" aria-label="Community reviews">
            <button
              type="button"
              className="crs-slider__nav crs-slider__nav--prev"
              onClick={scrollPrev}
              aria-label="Scroll to previous reviews"
            >
              <IconArrowLeft size={20} stroke={2} aria-hidden />
            </button>

            <div className="crs-slider__track-wrap">
              <div className="crs-slider__track" ref={trackRef} role="list">
                {reviews.map((item, index) => (
                  <button
                    key={item.reviewId || item.id}
                    type="button"
                    className={`crs-slider__card${item.featured ? " crs-slider__card--featured" : ""}`}
                    role="listitem"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Read review from ${item.name}`}
                  >
                    <div className="crs-slider__card-glow" aria-hidden />
                    <CardStars count={item.rating || 5} />
                    <p className="crs-slider__card-quote">{previewText(item.text || item.quote)}</p>
                    <footer className="crs-slider__card-footer">
                      <span className="crs-slider__avatar" aria-hidden>{item.initials || "?"}</span>
                      <div className="crs-slider__card-meta">
                        <p className="crs-slider__card-name">{item.name}</p>
                        <p className="crs-slider__card-role">{item.roleLabel || item.role}</p>
                        {item.eventName ? <p className="crs-slider__card-event">{item.eventName}</p> : null}
                        {item.submittedAt || item.createdAt ? (
                          <p className="crs-slider__card-date">{formatDate(item.submittedAt || item.createdAt)}</p>
                        ) : null}
                      </div>
                    </footer>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="crs-slider__nav crs-slider__nav--next"
              onClick={scrollNext}
              aria-label="Scroll to next reviews"
            >
              <IconArrowRight size={20} stroke={2} aria-hidden />
            </button>

            {reviews.length > 1 ? (
              <div className="crs-slider__dots" role="tablist" aria-label="Review slides">
                {reviews.map((item, index) => (
                  <button
                    key={item.reviewId || item.id}
                    type="button"
                    role="tab"
                    className={`crs-slider__dot${index === activeDot ? " crs-slider__dot--active" : ""}`}
                    aria-selected={index === activeDot}
                    aria-label={`Go to review by ${item.name}`}
                    onClick={() => {
                      const track = trackRef.current;
                      const card = track?.children[index];
                      card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="crs-slider__actions">
          <button type="button" className="crs-slider__cta" onClick={() => setFormOpen((o) => !o)}>
            {formOpen ? t("events:reviewsSlider.closeForm") : t("events:reviewsSlider.shareExperience")}
          </button>
        </div>

        {formOpen ? <CommunityReviewForm onSubmitted={() => setFormOpen(false)} /> : null}
      </div>

      <CommunityReviewModal
        reviews={reviews}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(-1)}
        onPrev={() => setActiveIndex((idx) => (idx <= 0 ? reviews.length - 1 : idx - 1))}
        onNext={() => setActiveIndex((idx) => (idx >= reviews.length - 1 ? 0 : idx + 1))}
      />
    </section>
  );
}
