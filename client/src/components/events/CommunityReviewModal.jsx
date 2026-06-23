import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconCalendar, IconMapPin, IconStarFilled, IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import "../../styles/community-review-modal.css";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function CardStars({ count = 5 }) {
  return (
    <div className="crs-modal__stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }, (_, i) => (
        <IconStarFilled key={i} size={18} stroke={1.5} aria-hidden />
      ))}
    </div>
  );
}

export default function CommunityReviewModal({ reviews = [], activeIndex = -1, onClose, onNext, onPrev }) {
  const review = activeIndex >= 0 ? reviews[activeIndex] : null;
  const touchStart = useRef(null);
  const touchMove = useRef(null);

  useEffect(() => {
    if (!review) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowRight") onNext?.();
      if (event.key === "ArrowLeft") onPrev?.();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [review, onClose, onNext, onPrev]);

  if (!review) return null;

  const text = review.text || review.quote || "";
  const role = review.roleLabel || review.role || "Community Member";
  const dateLabel = formatDate(review.submittedAt || review.createdAt);

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    touchMove.current = null;
  }

  function handleTouchMove(event) {
    const touch = event.touches?.[0];
    if (!touch || !touchStart.current) return;
    touchMove.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd() {
    if (!touchStart.current || !touchMove.current) return;
    const dx = touchMove.current.x - touchStart.current.x;
    const dy = touchMove.current.y - touchStart.current.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) onNext?.();
      else onPrev?.();
    } else if (dy > 90) {
      onClose?.();
    }
    touchStart.current = null;
    touchMove.current = null;
  }

  return createPortal(
    <div className="crs-modal" role="dialog" aria-modal="true" aria-labelledby="crs-modal-title" onClick={onClose}>
      <div
        className="crs-modal__panel"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button type="button" className="crs-modal__close" onClick={onClose} aria-label="Close">
          <IconX size={22} stroke={2} aria-hidden />
        </button>

        <button type="button" className="crs-modal__nav crs-modal__nav--prev" onClick={onPrev} aria-label="Previous review">
          <IconChevronLeft size={18} />
        </button>
        <button type="button" className="crs-modal__nav crs-modal__nav--next" onClick={onNext} aria-label="Next review">
          <IconChevronRight size={18} />
        </button>

        <div className="crs-modal__body">
          <CardStars count={review.rating || 5} />
          <h2 id="crs-modal-title" className="crs-modal__title">{review.name}</h2>
          <p className="crs-modal__role">{role}</p>
          <div className="crs-modal__meta">
            {review.eventName ? (
              <p className="crs-modal__meta-item">
                <IconMapPin size={16} aria-hidden stroke={1.75} />
                <span>{review.eventName}</span>
              </p>
            ) : null}
            {dateLabel ? (
              <p className="crs-modal__meta-item">
                <IconCalendar size={16} aria-hidden stroke={1.75} />
                <span>{dateLabel}</span>
              </p>
            ) : null}
          </div>
          <p className="crs-modal__quote">&ldquo;{text}&rdquo;</p>
          <div className="crs-modal__footer">
            <button type="button" className="crs-modal__footer-btn" onClick={onPrev}>Previous</button>
            <button type="button" className="crs-modal__footer-btn" onClick={onNext}>Next</button>
            <button type="button" className="crs-modal__footer-btn crs-modal__footer-btn--close" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
