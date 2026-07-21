import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconPlayerPlayFilled, IconVolume3, IconVolumeOff } from "@tabler/icons-react";
import useIsMobileViewport from "../../../hooks/useIsMobileViewport.js";
import EventCardMedia from "../card/EventCardMedia.jsx";
import { CategoryBadge } from "../card/EventCardBadges.jsx";
import { formatDuration } from "../shared/formatters.js";
import useYoutubePlayer from "./useYoutubePlayer.js";
import ShortCardHoverPreview from "./ShortCardHoverPreview.jsx";

export default function ShortCard({ event, onOpenLightbox, highlighted }) {
  const { t } = useTranslation(["eventExperience"]);
  const isMobile = useIsMobileViewport();
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const handler = (e) => setReducedMotion(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // The iframe never mounts on page load or mere scroll-into-view — only
  // once this specific card is actually hovered (desktop) or opened in the
  // lightbox (handled separately) per the lazy-load requirement.
  const showPreview = !isMobile && isHovering && !reducedMotion;

  const { containerRef, isReady, mute, unMute } = useYoutubePlayer({
    videoId: event.youtubeShortVideoId,
    enabled: showPreview,
    muted: isMuted,
  });

  function toggleMute(e) {
    e.stopPropagation();
    if (isMuted) {
      unMute();
      setIsMuted(false);
    } else {
      mute();
      setIsMuted(true);
    }
  }

  return (
    <motion.div
      id={`evx-short-${event.id}`}
      whileHover={!isMobile ? { scale: 1.08 } : undefined}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => {
        setIsHovering(false);
        setIsMuted(true);
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{ zIndex: isHovering ? 10 : 1 }}
      className={`relative aspect-[9/16] w-40 flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl bg-black shadow-lg transition-shadow sm:w-48 ${
        highlighted ? "ring-4 ring-evx-accent ring-offset-2 ring-offset-evx-bg" : ""
      }`}
      onClick={() => onOpenLightbox(event)}
      role="button"
      tabIndex={0}
      aria-label={t("eventExperience:shorts.watchShortAria", { title: event.title })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenLightbox(event);
        }
      }}
    >
      <EventCardMedia src={event.youtubeThumbnail} alt={event.title} className="absolute inset-0 h-full w-full" />

      {showPreview ? (
        <div className="absolute inset-0">
          <div ref={containerRef} className="h-full w-full" />
        </div>
      ) : null}

      <div className="absolute left-2 top-2 z-10">
        <CategoryBadge category={event.category} />
      </div>
      {event.youtubeDuration ? (
        <span className="absolute right-2 top-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {formatDuration(event.youtubeDuration)}
        </span>
      ) : null}

      {!showPreview ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white shadow-[0_0_18px_rgba(255,255,255,0.35)] dark:shadow-[0_0_22px_var(--color-evx-accent)]">
            <IconPlayerPlayFilled size={20} />
          </span>
        </div>
      ) : null}

      {showPreview && isReady ? (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? t("eventExperience:shorts.unmutePreview") : t("eventExperience:shorts.mutePreview")}
          className="absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          {isMuted ? <IconVolumeOff size={15} /> : <IconVolume3 size={15} />}
        </button>
      ) : null}

      {!showPreview ? (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8">
          <p className="line-clamp-1 text-xs font-bold text-white">{event.title}</p>
          <p className="text-[11px] text-white/75">{event.dateLabel}</p>
        </div>
      ) : (
        <ShortCardHoverPreview event={event} onWatchFull={onOpenLightbox} />
      )}
    </motion.div>
  );
}
