import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { IconMapPin, IconCalendar, IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import "../../styles/event-highlight-video-modal.css";

const BADGE_KEYS_EN = {
  "Past Event": "pastEvent",
  "Watch Highlights": "watchHighlights",
  "Highlights Coming Soon": "highlightsComingSoon",
  "Video Available": "videoAvailable",
};

export default function EventHighlightVideoModal({
  highlights = [],
  activeIndex = -1,
  onClose,
  onNext,
  onPrev,
  onTrack = () => {},
}) {
  const { t } = useTranslation(["events", "common"]);
  const highlight = activeIndex >= 0 ? highlights[activeIndex] : null;
  const touchStart = useRef(null);
  const touchMove = useRef(null);

  useEffect(() => {
    if (!highlight) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNext?.();
      if (event.key === "ArrowLeft") onPrev?.();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [highlight, onClose, onNext, onPrev]);

  if (!highlight) return null;

  const hasVideo = Boolean(highlight.highlightEmbedUrl || highlight.youtubeEmbedUrl);
  const embedBase = highlight.highlightEmbedUrl || highlight.youtubeEmbedUrl || "";
  const embedUrl = hasVideo
    ? `${embedBase}${embedBase.includes("?") ? "&" : "?"}autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : "";

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
    <div
      className="ehvm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ehvm-title"
      onClick={onClose}
    >
      <div
        className="ehvm__panel"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button type="button" className="ehvm__close" onClick={onClose} aria-label="Close">
          <IconX size={22} stroke={2} aria-hidden />
        </button>

        <div className="ehvm__media">
          <button type="button" className="ehvm__nav ehvm__nav--prev" onClick={onPrev} aria-label="Previous highlight">
            <IconChevronLeft size={18} />
          </button>
          {hasVideo ? (
            <div className="ehvm__video-wrap">
              <iframe
                className="ehvm__video"
                src={embedUrl}
                title={`${highlight.highlightTitle} highlight video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                onLoad={() => onTrack("video_play", highlight)}
              />
            </div>
          ) : (
            <div className="ehvm__coming-soon">
              {highlight.thumbnailUrl ? (
                <img src={highlight.thumbnailUrl} alt="" className="ehvm__placeholder-image" />
              ) : null}
              <div className="ehvm__coming-soon-overlay">
                <p className="ehvm__coming-soon-badge">{t("events:highlightsSlider.badge.highlightsComingSoon")}</p>
                <p className="ehvm__coming-soon-text">
                  {t("events:videoModal.comingSoonText")}
                </p>
              </div>
            </div>
          )}
          <button type="button" className="ehvm__nav ehvm__nav--next" onClick={onNext} aria-label="Next highlight">
            <IconChevronRight size={18} />
          </button>
        </div>

        <div className="ehvm__body">
          <p className="ehvm__eyebrow">
            {BADGE_KEYS_EN[highlight.badgeText]
              ? t(`events:highlightsSlider.badge.${BADGE_KEYS_EN[highlight.badgeText]}`)
              : highlight.badgeText}
          </p>
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
          <div className="ehvm__footer">
            <button type="button" className="ehvm__footer-btn" onClick={onPrev}>{t("events:videoModal.previous")}</button>
            <button type="button" className="ehvm__footer-btn" onClick={onNext}>{t("common:buttons.next")}</button>
            <button type="button" className="ehvm__footer-btn ehvm__footer-btn--close" onClick={onClose}>{t("common:buttons.close")}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
