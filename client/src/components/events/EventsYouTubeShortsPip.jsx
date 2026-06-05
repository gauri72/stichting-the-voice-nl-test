import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import "../../styles/events-highlights-gallery.css";

/**
 * @param {{ video: { title: string, youtubeId: string } | null, onClose: () => void }} props
 */
export default function EventsYouTubeShortsPip({ video, onClose }) {
  useEffect(() => {
    if (!video) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [video, onClose]);

  if (!video?.youtubeId) return null;

  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return createPortal(
    <div
      className="events-highlights-pip events-highlights-pip--video"
      role="dialog"
      aria-modal="true"
      aria-labelledby="events-highlights-pip-title"
      onClick={onClose}
    >
      <div
        className="events-highlights-pip__panel events-highlights-pip__panel--video"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="events-highlights-pip__header">
          <div>
            <p className="events-highlights-pip__eyebrow">Event highlight</p>
            <h2 id="events-highlights-pip-title" className="events-highlights-pip__title">
              {video.title}
            </h2>
          </div>
          <button
            type="button"
            className="events-highlights-pip__close"
            onClick={onClose}
            aria-label="Close video"
          >
            <FaXmark aria-hidden />
          </button>
        </header>

        <div className="events-highlights-pip__stage events-highlights-pip__stage--video">
          <div className="events-highlights-pip__video-wrap">
            <iframe
              className="events-highlights-pip__video"
              src={embedUrl}
              title={`${video.title} — YouTube Short`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
