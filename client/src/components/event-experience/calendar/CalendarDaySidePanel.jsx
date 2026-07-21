import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconClock, IconVideo, IconX } from "@tabler/icons-react";

const FOCUSABLE_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function CalendarDaySidePanel({ date, dayData, onClose }) {
  const { t } = useTranslation(["eventExperience"]);
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!date) return undefined;
    lastFocusedRef.current = document.activeElement;

    const focusables = () => Array.from(panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []);
    window.setTimeout(() => focusables()[0]?.focus(), 0);

    function onKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
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
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [date, onClose]);

  return createPortal(
    <AnimatePresence>
      {date ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1250] bg-black/50"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={t("eventExperience:calendar.sidePanel.ariaLabel")}
            className="fixed right-0 top-0 z-[1260] h-full w-full max-w-sm overflow-y-auto bg-evx-surface-elevated p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-evx-heading">
                {date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("eventExperience:calendar.sidePanel.close")}
                className="rounded-full p-1.5 transition hover:bg-evx-bg-muted"
              >
                <IconX size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {(dayData?.events || []).map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}/tickets`}
                  className="flex flex-col gap-1 rounded-xl border border-evx-border p-3 transition hover:border-evx-accent"
                >
                  <p className="font-bold text-evx-heading">{event.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-evx-text-muted">
                    <IconClock size={13} /> {event.startTime}
                    {event.hasVideo ? <IconVideo size={13} className="ml-1 text-evx-accent" /> : null}
                  </p>
                  <span className="w-fit rounded-full bg-evx-bg-muted px-2 py-0.5 text-[11px] font-semibold text-evx-text-secondary">
                    {event.category}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
