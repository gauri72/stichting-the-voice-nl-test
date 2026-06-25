import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconArrowRight, IconPlayerPlay } from "@tabler/icons-react";
import { apiFetch } from "../../utils/api.js";
import { useAutoAdvance } from "../../hooks/useAutoAdvance.js";
import defaultThumb from "../../assets/Home/featured events-light.png";
import EventHighlightVideoModal from "./EventHighlightVideoModal.jsx";
import "../../styles/past-event-highlights-slider.css";

const AUTO_SCROLL_MS = 7000;
const SCROLL_STEP = 320;

const DEFAULT_IMPACT_TEXT_EN =
  "An unforgettable V.O.I.C.E. NL experience filled with culture, connection and shared memories.";

const BADGE_KEYS_EN = {
  "Past Event": "pastEvent",
  "Watch Highlights": "watchHighlights",
  "Highlights Coming Soon": "highlightsComingSoon",
  "Video Available": "videoAvailable",
};

const CTA_KEYS_EN = {
  "View Memories": "viewMemories",
  "Watch Highlights": "watchHighlights",
};

function badgeClass(badgeText) {
  if (badgeText === "Highlights Coming Soon") return "peh-slider__card-badge--soon";
  if (badgeText === "Past Event") return "peh-slider__card-badge--past";
  return "";
}

export default function PastEventHighlightsSlider() {
  const { t } = useTranslation(["events"]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeDot, setActiveDot] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    apiFetch("/api/public/event-highlights")
      .then((data) => {
        if (!active) return;
        setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
      })
      .catch(() => {
        if (active) setHighlights([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const track = useCallback(async (action, item) => {
    if (!item?.eventId || String(item.eventId).startsWith("legacy-")) return;
    try {
      await apiFetch("/api/public/event-highlights/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: item.eventId, action }),
      });
    } catch {
      /* no-op tracking */
    }
  }, []);

  const scrollBy = useCallback((delta) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const scrollNext = useCallback(() => scrollBy(SCROLL_STEP), [scrollBy]);
  const scrollPrev = useCallback(() => scrollBy(-SCROLL_STEP), [scrollBy]);

  useAutoAdvance(scrollNext, { enabled: highlights.length > 1 && !isPaused, intervalMs: AUTO_SCROLL_MS });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    function onScroll() {
      const cardWidth = track.firstElementChild?.getBoundingClientRect().width || SCROLL_STEP;
      const index = Math.round(track.scrollLeft / (cardWidth + 16));
      setActiveDot(Math.max(0, Math.min(index, highlights.length - 1)));
    }

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [highlights.length]);

  if (loading) {
    return null;
  }

  if (!highlights.length) {
    return (
      <section id="events-highlights" className="peh-slider" aria-labelledby="peh-slider-title">
        <div className="peh-slider__inner">
          <header className="peh-slider__header">
            <h2 id="peh-slider-title" className="peh-slider__title">
              {t("events:highlightsSlider.titleLead")}
              <span className="peh-slider__title-emphasis">{t("events:highlightsSlider.titleEmphasis")}</span>
            </h2>
            <p className="peh-slider__subtitle">
              {t("events:highlightsSlider.subtitle")}
            </p>
          </header>
          <p className="peh-slider__empty" role="status">
            {t("events:highlightsSlider.emptyState")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="events-highlights"
      className="peh-slider"
      aria-labelledby="peh-slider-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="peh-slider__inner">
        <header className="peh-slider__header">
          <h2 id="peh-slider-title" className="peh-slider__title">
            {t("events:highlightsSlider.titleLead")}
            <span className="peh-slider__title-emphasis">{t("events:highlightsSlider.titleEmphasis")}</span>
          </h2>
          <p className="peh-slider__subtitle">
            {t("events:highlightsSlider.subtitle")}
          </p>
        </header>

        <div className="peh-slider__carousel" aria-roledescription="carousel" aria-label="Past event highlights">
          <button
            type="button"
            className="peh-slider__nav peh-slider__nav--prev"
            onClick={scrollPrev}
            aria-label="Scroll to previous highlights"
          >
            <IconArrowLeft size={20} stroke={2} aria-hidden />
          </button>

          <div className="peh-slider__track-wrap">
            <div className="peh-slider__track" ref={trackRef} role="list">
              {highlights.map((item) => {
                const badgeKey = BADGE_KEYS_EN[item.badgeText];
                const resolvedBadgeText = badgeKey ? t(`events:highlightsSlider.badge.${badgeKey}`) : item.badgeText;
                const ctaKey = CTA_KEYS_EN[item.ctaText];
                const resolvedCtaText = ctaKey ? t(`events:highlightsSlider.cta.${ctaKey}`) : item.ctaText;
                const resolvedImpactText =
                  item.impactText && item.impactText !== DEFAULT_IMPACT_TEXT_EN
                    ? item.impactText
                    : t("events:highlightsSlider.defaultImpactText");
                return (
                  <button
                    key={item.eventId}
                    type="button"
                    className={`peh-slider__card${item.featuredHighlight ? " peh-slider__card--featured" : ""}`}
                    role="listitem"
                    onClick={() => {
                      const index = highlights.findIndex((h) => h.eventId === item.eventId);
                      setActiveIndex(index);
                      track("modal_open", item);
                      track("highlight_view", item);
                    }}
                    aria-label={`${resolvedCtaText}: ${item.highlightTitle}`}
                  >
                    <div className="peh-slider__card-media">
                      <img
                        className="peh-slider__card-image"
                        src={item.thumbnailUrl || defaultThumb}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="peh-slider__card-overlay" aria-hidden />
                      <p className={`peh-slider__card-badge ${badgeClass(item.badgeText)}`}>{resolvedBadgeText}</p>
                      {item.youtubeVideoId ? (
                        <span className="peh-slider__card-play" aria-hidden>
                          <span className="peh-slider__card-play-icon">
                            <IconPlayerPlay size={22} fill="currentColor" />
                          </span>
                        </span>
                      ) : null}
                    </div>
                    <div className="peh-slider__card-body">
                      <h3 className="peh-slider__card-title">{item.highlightTitle}</h3>
                      <div className="peh-slider__card-meta">
                        {item.formattedDate ? <span>{item.formattedDate}</span> : null}
                        {item.category ? <span>{item.category}</span> : null}
                        {item.location ? <span>{item.location}</span> : null}
                      </div>
                      <p className="peh-slider__card-impact">{resolvedImpactText}</p>
                      <p className="peh-slider__card-cta">{resolvedCtaText}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="peh-slider__nav peh-slider__nav--next"
            onClick={scrollNext}
            aria-label="Scroll to next highlights"
          >
            <IconArrowRight size={20} stroke={2} aria-hidden />
          </button>

          {highlights.length > 1 ? (
            <div className="peh-slider__dots" role="tablist" aria-label="Highlight slides">
              {highlights.map((item, index) => (
                <button
                  key={item.eventId}
                  type="button"
                  role="tab"
                  className={`peh-slider__dot${index === activeDot ? " peh-slider__dot--active" : ""}`}
                  aria-selected={index === activeDot}
                  aria-label={`Go to ${item.highlightTitle}`}
                  onClick={() => {
                    const track = trackRef.current;
                    const card = track?.children[index];
                    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <EventHighlightVideoModal
        highlights={highlights}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(-1)}
        onPrev={() => setActiveIndex((idx) => (idx <= 0 ? highlights.length - 1 : idx - 1))}
        onNext={() => setActiveIndex((idx) => (idx >= highlights.length - 1 ? 0 : idx + 1))}
        onTrack={track}
      />
    </section>
  );
}
