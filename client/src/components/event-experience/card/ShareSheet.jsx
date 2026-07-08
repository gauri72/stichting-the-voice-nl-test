import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconBrandWhatsapp,
  IconBrandFacebook,
  IconBrandX,
  IconMail,
  IconLink,
  IconShare3,
  IconX,
  IconCheck,
} from "@tabler/icons-react";

const FOCUSABLE_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function buildEventUrl(event) {
  return `${window.location.origin}/events/${event.slug || event.id}/tickets`;
}

export function ShareButton({ event, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Share ${event.title}`}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 ${className}`}
      >
        <IconShare3 size={16} />
      </button>
      {open ? <ShareSheet event={event} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export default function ShareSheet({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = buildEventUrl(event);
  const text = `Check out ${event.title} — V.O.I.C.E. NL`;
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
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
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — link is still visible to copy manually.
    }
  }

  const links = [
    {
      label: "WhatsApp",
      icon: IconBrandWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      label: "Facebook",
      icon: IconBrandFacebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "X",
      icon: IconBrandX,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "Email",
      icon: IconMail,
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
    },
  ];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          role="dialog"
          aria-modal="true"
          aria-label="Share this event"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl bg-evx-surface-elevated p-5 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-evx-heading">Share this event</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 transition hover:bg-evx-bg-muted"
            >
              <IconX size={18} />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-4 gap-3">
            {links.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-evx-border p-3 text-evx-text-secondary transition hover:border-evx-accent hover:text-evx-accent"
              >
                <Icon size={20} />
                <span className="text-[11px] font-medium">{label}</span>
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-evx-border px-4 py-2.5 text-sm font-semibold text-evx-text transition hover:border-evx-accent"
          >
            {copied ? <IconCheck size={16} className="text-emerald-500" /> : <IconLink size={16} />}
            {copied ? "Link copied!" : "Copy link"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
