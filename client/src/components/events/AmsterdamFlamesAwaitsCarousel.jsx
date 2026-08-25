import { useEffect, useRef, useState } from "react";

const AUTOPLAY_MS = 4000;
const RESUME_DELAY_MS = 3000;

/**
 * Auto-advancing horizontal carousel for the "What Awaits You" cards — avoids
 * a long vertical stack of 10 items on mobile. Uses native scroll-snap so
 * manual touch/trackpad swiping keeps working for free; autoplay pauses
 * while the visitor is actively interacting with it.
 */
export default function AmsterdamFlamesAwaitsCarousel({ items }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    const card = track?.children[index];
    if (card) {
      track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    }
  }, [index]);

  function pause() {
    pausedRef.current = true;
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  }

  function resumeSoon() {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }

  return (
    <div
      className="af-awaits__track"
      ref={trackRef}
      onMouseEnter={pause}
      onMouseLeave={resumeSoon}
      onTouchStart={pause}
      onTouchEnd={resumeSoon}
    >
      {items.map((item, i) => (
        <div className="af-awaits__item" key={item.title}>
          <span className="af-awaits__index">{String(i + 1).padStart(2, "0")}</span>
          <item.icon className="af-awaits__icon" size={24} />
          <h3>
            {item.title}
            <span className="af-awaits__tagline">{item.tagline}</span>
          </h3>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}
