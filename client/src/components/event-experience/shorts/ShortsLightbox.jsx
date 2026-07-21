import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import useYoutubePlayer from "./useYoutubePlayer.js";

const FOCUSABLE_SELECTOR =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ShortsLightbox({ event, onClose, onPrev, onNext }) {
  const { t } = useTranslation(["eventExperience"]);
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const { containerRef } = useYoutubePlayer({
    videoId: event?.youtubeShortVideoId,
    enabled: Boolean(event),
    muted: false,
  });

  // Focus trap + Escape/arrow-key handling + restore focus on close.
  useEffect(() => {
    if (!event) return undefined;
    lastFocusedRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    const focusables = () => Array.from(panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []);
    window.setTimeout(() => focusables()[0]?.focus(), 0);

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key !== "Tab") return;

      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [event, onClose, onPrev, onNext]);

  if (!event) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evx-lightbox-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-5xl flex-col gap-4 rounded-2xl bg-evx-surface-elevated p-4 sm:flex-row sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("eventExperience:shorts.close")}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          <IconX size={20} />
        </button>

        <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-xl bg-black">
          <div ref={containerRef} className="h-full w-full" />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 px-2 sm:px-0">
          <h3 id="evx-lightbox-title" className="text-xl font-bold text-evx-heading">
            {event.title}
          </h3>
          <p className="text-sm text-evx-text-muted">{event.dateLabel}</p>
          {event.description ? <p className="text-sm text-evx-text-secondary">{event.description}</p> : null}
          <Link
            to={`/events/${event.slug || event.id}/tickets`}
            className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-evx-accent px-6 py-3 text-sm font-bold text-white shadow transition hover:brightness-110"
          >
            {t("eventExperience:shorts.getTickets")}
          </Link>
        </div>

        <button
          type="button"
          onClick={onPrev}
          aria-label={t("eventExperience:shorts.previousShort")}
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:flex"
        >
          <IconChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label={t("eventExperience:shorts.nextShort")}
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:flex"
        >
          <IconChevronRight size={22} />
        </button>
      </div>
    </div>,
    document.body
  );
}
