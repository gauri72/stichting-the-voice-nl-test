import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconSparkles,
} from "@tabler/icons-react";
import { apiFetch } from "../../utils/api.js";
import { useAutoAdvance } from "../../hooks/useAutoAdvance.js";
import { useCmsLabelTranslation } from "../../hooks/useCmsLabelTranslation.js";
import defaultHeroLight from "../../assets/Home/featured events-light.png";
import "../../styles/featured-events-carousel.css";

const AUTO_PLAY_MS = 6000;
const SWIPE_THRESHOLD = 48;

const DISPLAY_MODE_CLASS = {
  Auto: "fec--mode-auto",
  Light: "fec--mode-light",
  Dark: "fec--mode-dark",
  Cinematic: "fec--mode-cinematic",
  Elegant: "fec--mode-elegant",
  "Women-focused": "fec--mode-women",
  Cultural: "fec--mode-cultural",
  "Concert/DJ": "fec--mode-concert",
  "Family/Community": "fec--mode-family",
};

function resolveImageUrl(event, isMobile) {
  const hero = event.featuredHeroImageUrl || event.heroImage || "";
  const mobile = event.featuredMobileImageUrl || hero;
  return isMobile ? mobile || hero : hero;
}

function getRemainingTimeLabel(dateIso, startTime, liveNowLabel) {
  if (!dateIso) return "";
  const base = new Date(dateIso);
  if (Number.isNaN(base.getTime())) return "";

  const timeMatch = String(startTime || "20:00").match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    base.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  }

  const diffMs = base.getTime() - Date.now();
  if (diffMs <= 0) return liveNowLabel;

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${hours}h ${minutes}m`;
}

// Per-event CTA text is a separate small component because the hook it
// needs (useCmsLabelTranslation) can't be called inline inside the
// carousel's .map() — hooks must run per component instance, not per loop
// iteration.
function FeaturedEventCtaText({ event }) {
  const isDefault = !event.featuredCtaText || event.featuredCtaText === "Book Tickets";
  return useCmsLabelTranslation(isDefault ? "" : event.featuredCtaText, "events:carousel.buyTickets");
}

export default function FeaturedEventsCarousel({
  pageContext = "home",
  variant = "fullHero",
}) {
  const { t } = useTranslation(["events"]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );
  const touchStartX = useRef(null);
  const containerRef = useRef(null);
  const resumeTimerRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(resumeTimerRef.current);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    apiFetch(`/api/public/featured-events?page=${pageContext}`)
      .then((data) => {
        if (!active) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
        setActiveIndex(0);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pageContext]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goTo = useCallback(
    (index) => {
      if (!events.length) return;
      const normalized = ((index % events.length) + events.length) % events.length;
      setActiveIndex(normalized);
    },
    [events.length]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useAutoAdvance(goNext, { enabled: events.length > 1 && !isPaused, intervalMs: AUTO_PLAY_MS });

  const activeSlide = events[activeIndex];

  useEffect(() => {
    if (!activeSlide) {
      setTimeRemaining("");
      return undefined;
    }

    function updateCountdown() {
      setTimeRemaining(getRemainingTimeLabel(activeSlide.date, activeSlide.startTime, t("events:carousel.liveNow")));
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 60_000);
    return () => window.clearInterval(intervalId);
  }, [activeSlide]);

  useEffect(() => {
    if (!events.length) return undefined;
    const firstImage = resolveImageUrl(events[0], isMobile) || defaultHeroLight;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = firstImage;
    document.head.appendChild(link);
    return () => link.remove();
  }, [events, isMobile]);

  useEffect(() => {
    function onKeyDown(event) {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  function handleTouchStart(event) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    setIsPaused(true);
  }

  function handleTouchEnd(event) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX == null || endX == null) return;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) goNext();
    else goPrev();
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => setIsPaused(false), AUTO_PLAY_MS);
  }

  if (loading || events.length === 0) {
    return null;
  }

  const slide = activeSlide;
  const alignment = (slide.featuredTextAlignment || "Left").toLowerCase();
  const overlay = (slide.featuredOverlayStrength || "Medium").toLowerCase();
  const modeClass = DISPLAY_MODE_CLASS[slide.featuredDisplayMode] || DISPLAY_MODE_CLASS.Auto;

  const slidesToRender = isMobile
    ? activeSlide
      ? [{ event: activeSlide, index: activeIndex }]
      : []
    : events.map((event, index) => ({ event, index }));

  return (
    <section
      ref={containerRef}
      className={`featured-events-carousel fec--${variant} ${modeClass} fec--align-${alignment} fec--overlay-${overlay}${isMobile ? " fec--mobile" : ""}`}
      aria-roledescription="carousel"
      aria-label="Featured events"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsPaused(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="fec__viewport">
        {slidesToRender.map(({ event, index }) => {
          const slideImage = resolveImageUrl(event, isMobile) || defaultHeroLight;
          const isActive = index === activeIndex;
          const showMembershipBadge =
            event.membershipIncluded || event.membershipDiscountEligible;

          return (
            <article
              key={event.id}
              className={`fec__slide${isActive || isMobile ? " fec__slide--active" : ""}`}
              aria-hidden={!isActive}
              style={{
                "--fec-object-position": event.imageObjectPosition || "center center",
              }}
            >
              <div className="fec__media" aria-hidden={!isActive}>
                <img
                  className="fec__image"
                  src={slideImage}
                  alt={event.featuredImageAlt || event.featuredTitle}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
                <div className="fec__overlay" />
              </div>
              <div className="fec__content">
                <div className="fec__content-body">
                  <p className="fec__badge">{event.featuredBadgeText}</p>
                  <h2 className="fec__title">{event.featuredTitle}</h2>
                  {event.featuredSubtitle ? (
                    <p className="fec__subtitle">{event.featuredSubtitle}</p>
                  ) : null}
                  {event.featuredDescription ? (
                    <p className="fec__description">{event.featuredDescription}</p>
                  ) : null}
                  <div className="fec__meta" aria-label="Event details">
                    {event.venueName ? (
                      <p className="fec__meta-item">
                        <IconMapPin aria-hidden stroke={1.75} size={16} />
                        <span>{event.venueName}</span>
                      </p>
                    ) : null}
                    {event.formattedDate ? (
                      <p className="fec__meta-item">
                        <IconCalendar aria-hidden stroke={1.75} size={16} />
                        <span>
                          {event.formattedDate}
                          {event.startTime ? ` · ${event.startTime}` : ""}
                        </span>
                      </p>
                    ) : null}
                    {isActive && timeRemaining ? (
                      <p className="fec__meta-item fec__meta-item--time">
                        <IconClock aria-hidden stroke={1.75} size={16} />
                        <span>{timeRemaining}</span>
                      </p>
                    ) : null}
                  </div>
                  {showMembershipBadge ? (
                    <p className="fec__membership-badge">
                      <IconSparkles size={14} aria-hidden stroke={2} />
                      <span>
                        {event.membershipIncluded
                          ? t("events:carousel.membershipIncluded")
                          : t("events:carousel.memberDiscounts")}
                      </span>
                    </p>
                  ) : null}
                </div>
                <div className="fec__actions">
                  <Link className="fec__cta fec__cta--primary cta-pulse" to={event.ticketsUrl}>
                    <FeaturedEventCtaText event={event} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {events.length > 1 ? (
        <>
          <button
            type="button"
            className="fec__nav fec__nav--prev"
            onClick={goPrev}
            aria-label="Previous featured event"
          >
            <IconArrowLeft size={22} stroke={2} aria-hidden />
          </button>
          <button
            type="button"
            className="fec__nav fec__nav--next"
            onClick={goNext}
            aria-label="Next featured event"
          >
            <IconArrowRight size={22} stroke={2} aria-hidden />
          </button>
          <div className="fec__dots" role="tablist" aria-label="Featured event slides">
            {events.map((event, index) => (
              <button
                key={event.id}
                type="button"
                role="tab"
                className={`fec__dot${index === activeIndex ? " fec__dot--active" : ""}`}
                aria-selected={index === activeIndex}
                aria-label={`Go to ${event.featuredTitle}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
