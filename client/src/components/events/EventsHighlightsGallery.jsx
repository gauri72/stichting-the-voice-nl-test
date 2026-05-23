import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaXmark
} from "react-icons/fa6";
import "../../styles/events-highlights-gallery.css";

export default function EventsHighlightsGallery({ gallery, onClose }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState(false);

  const images = gallery?.images ?? [];
  const total = images.length;
  const title = gallery?.title ?? "Event highlights";

  useEffect(() => {
    setIndex(0);
    setBroken(false);
  }, [gallery]);

  useEffect(() => {
    setBroken(false);
  }, [index]);

  const goPrev = useCallback(() => {
    if (total < 2) return;
    setIndex((current) => (current - 1 + total) % total);
    setBroken(false);
  }, [total]);

  const goNext = useCallback(() => {
    if (total < 2) return;
    setIndex((current) => (current + 1) % total);
    setBroken(false);
  }, [total]);

  useEffect(() => {
    if (!gallery) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gallery, onClose, goPrev, goNext]);

  if (!gallery || total === 0) return null;

  const currentSrc = images[index];

  return createPortal(
    <div
      className="events-highlights-pip"
      role="dialog"
      aria-modal="true"
      aria-labelledby="events-highlights-pip-title"
      onClick={onClose}
    >
      <div
        className="events-highlights-pip__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="events-highlights-pip__header">
          <div>
            <p className="events-highlights-pip__eyebrow">Event highlights</p>
            <h2 id="events-highlights-pip-title" className="events-highlights-pip__title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="events-highlights-pip__close"
            onClick={onClose}
            aria-label="Close highlights gallery"
          >
            <FaXmark aria-hidden />
          </button>
        </header>

        <div className="events-highlights-pip__stage">
          {total > 1 && (
            <button
              type="button"
              className="events-highlights-pip__nav events-highlights-pip__nav--prev"
              onClick={goPrev}
              aria-label="Previous image"
            >
              <FaChevronLeft aria-hidden />
            </button>
          )}

          <figure className="events-highlights-pip__figure">
            {!broken ? (
              <img
                key={currentSrc}
                className="events-highlights-pip__image"
                src={currentSrc}
                alt={`${title} highlight ${index + 1} of ${total}`}
                onError={() => setBroken(true)}
              />
            ) : (
              <p className="events-highlights-pip__error">
                This image could not be loaded. Use the arrows to view other photos.
              </p>
            )}
          </figure>

          {total > 1 && (
            <button
              type="button"
              className="events-highlights-pip__nav events-highlights-pip__nav--next"
              onClick={goNext}
              aria-label="Next image"
            >
              <FaChevronRight aria-hidden />
            </button>
          )}
        </div>

        <footer className="events-highlights-pip__footer">
          <span className="events-highlights-pip__counter">
            {index + 1} / {total}
          </span>
        </footer>
      </div>
    </div>,
    document.body
  );
}
