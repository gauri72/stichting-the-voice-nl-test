import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import EventCard from "../card/EventCard.jsx";
import EventCardMedia from "../card/EventCardMedia.jsx";
import HeroProgressIndicators from "./HeroProgressIndicators.jsx";
import HeroAmbientParticles from "./HeroAmbientParticles.jsx";
import useFeaturedEvents from "./useFeaturedEvents.js";
import { useEventExperience } from "../EventExperienceContext.jsx";

const SLIDE_DURATION_MS = 7000;
const SWIPE_THRESHOLD_PX = 50;

export default function FeaturedHeroCarousel() {
  const { events, loading } = useFeaturedEvents();
  const { scrollToShort } = useEventExperience();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const handler = (e) => setReducedMotion(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isPaused || reducedMotion || events.length < 2) return undefined;
    const timer = window.setTimeout(() => {
      setActiveIndex((i) => (i + 1) % events.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, reducedMotion, events.length]);

  useEffect(() => {
    if (activeIndex >= events.length) setActiveIndex(0);
  }, [events.length, activeIndex]);

  function goTo(index) {
    setActiveIndex(((index % events.length) + events.length) % events.length);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      goTo(activeIndex + (delta < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowLeft") goTo(activeIndex - 1);
    if (e.key === "ArrowRight") goTo(activeIndex + 1);
  }

  if (loading) {
    return (
      <div className="relative flex h-[60vh] min-h-[420px] w-full items-center justify-center bg-evx-bg-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-evx-border border-t-evx-accent" />
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="relative flex h-[40vh] min-h-[280px] w-full flex-col items-center justify-center gap-2 bg-evx-bg-muted text-evx-text-muted">
        <p className="text-lg font-semibold">No featured events right now</p>
        <p className="text-sm">Check back soon for upcoming experiences.</p>
      </div>
    );
  }

  const active = events[activeIndex];
  const bgImage = active.featuredHeroImageUrl || active.heroImage;

  return (
    <section
      aria-label="Featured events"
      tabIndex={0}
      className="relative h-[72vh] min-h-[480px] w-full overflow-hidden bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-evx-accent"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
    >
      {/* Ambient blurred glow behind the sharp foreground image — gives a
          subtle depth-of-field feel without a heavy/literal blur overlay. */}
      <div className="absolute inset-0 scale-110 opacity-50 blur-3xl">
        <EventCardMedia src={bgImage} alt="" className="h-full w-full" />
      </div>

      <HeroAmbientParticles />

      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <EventCard variant="featured" event={active} onWatchShort={(e) => scrollToShort(e.id)} />
        </motion.div>
      </AnimatePresence>

      {events.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous featured event"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60 sm:flex"
          >
            <IconChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next featured event"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60 sm:flex"
          >
            <IconChevronRight size={22} />
          </button>

          <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center">
            <HeroProgressIndicators
              count={events.length}
              activeIndex={activeIndex}
              onSelect={goTo}
              durationMs={SLIDE_DURATION_MS}
              isPaused={isPaused}
              reducedMotion={reducedMotion}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
