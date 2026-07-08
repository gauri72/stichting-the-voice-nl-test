import { useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import ShortCard from "./ShortCard.jsx";

export default function ShortsRow({ label, events, onOpenLightbox, highlightedShortId }) {
  const scrollRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);

  if (!events.length) return null;

  function scrollByAmount(direction) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.8 * direction, behavior: "smooth" });
  }

  return (
    <div className="relative" onMouseEnter={() => setShowArrows(true)} onMouseLeave={() => setShowArrows(false)}>
      <h3 className="mb-3 px-4 text-lg font-bold text-evx-heading sm:px-0">{label}</h3>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label={`Scroll ${label} left`}
          className={`absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-opacity sm:flex ${
            showArrows ? "opacity-100" : "opacity-0"
          }`}
        >
          <IconChevronLeft size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 py-8 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {events.map((event) => (
            <ShortCard
              key={event.id}
              event={event}
              onOpenLightbox={onOpenLightbox}
              highlighted={highlightedShortId === event.id}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label={`Scroll ${label} right`}
          className={`absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-opacity sm:flex ${
            showArrows ? "opacity-100" : "opacity-0"
          }`}
        >
          <IconChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
