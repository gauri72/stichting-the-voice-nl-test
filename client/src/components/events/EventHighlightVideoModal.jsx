import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { IconMapPin, IconCalendar, IconX } from "@tabler/icons-react";
import "../../styles/event-highlight-video-modal.css";

export default function EventHighlightVideoModal({ highlight, onClose }) {
  useEffect(() => {
    if (!highlight) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [highlight, onClose]);

  if (!highlight) return null;

  const hasVideo = Boolean(highlight.youtubeVideoId);
  const embedUrl = hasVideo
    ? `${highlight.youtubeEmbedUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : "";

  return createPortal(
    <div
      className="ehvm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ehvm-title"
      onClick={onClose}
    >
      <div className="ehvm__panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ehvm__close" onClick={onClose} aria-label="Close">
          <IconX size={22} stroke={2} aria-hidden />
        </button>

        <div className="ehvm__media">
          {hasVideo ? (
            <div className="ehvm__video-wrap">
              <iframe
                className="ehvm__video"
                src={embedUrl}
                title={`${highlight.highlightTitle} highlight video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="ehvm__coming-soon">
              {highlight.thumbnailUrl ? (
                <img src={highlight.thumbnailUrl} alt="" className="ehvm__placeholder-image" />
              ) : null}
              <div className="ehvm__coming-soon-overlay">
                <p className="ehvm__coming-soon-badge">Highlights Coming Soon</p>
                <p className="ehvm__coming-soon-text">
                  We are preparing the highlight reel for this unforgettable event.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="ehvm__body">
          <p className="ehvm__eyebrow">{highlight.badgeText}</p>
          <h2 id="ehvm-title" className="ehvm__title">
            {highlight.highlightTitle}
          </h2>
          {highlight.highlightSubtitle ? (
            <p className="ehvm__subtitle">{highlight.highlightSubtitle}</p>
          ) : null}
          <div className="ehvm__meta">
            {highlight.formattedDate ? (
              <p className="ehvm__meta-item">
                <IconCalendar size={16} aria-hidden stroke={1.75} />
                <span>{highlight.formattedDate}</span>
              </p>
            ) : null}
            {highlight.location ? (
              <p className="ehvm__meta-item">
                <IconMapPin size={16} aria-hidden stroke={1.75} />
                <span>{highlight.location}</span>
              </p>
            ) : null}
            {highlight.category ? (
              <p className="ehvm__meta-item ehvm__meta-item--category">{highlight.category}</p>
            ) : null}
          </div>
          <p className="ehvm__description">
            {highlight.highlightDescription || highlight.impactText}
          </p>
          {highlight.detailsUrl ? (
            <Link to={highlight.detailsUrl} className="ehvm__details-link" onClick={onClose}>
              View Event Page
            </Link>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
