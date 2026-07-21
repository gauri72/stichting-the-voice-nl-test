import { useTranslation } from "react-i18next";

export default function HeroProgressIndicators({ count, activeIndex, onSelect, durationMs, isPaused, reducedMotion }) {
  const { t } = useTranslation(["eventExperience"]);
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label={t("eventExperience:hero.slidesAria")}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          aria-label={t("eventExperience:hero.slideAria", { index: i + 1, count })}
          onClick={() => onSelect(i)}
          className="relative h-1.5 w-8 overflow-hidden rounded-full bg-white/25 transition-all hover:bg-white/40 sm:w-10"
        >
          {i === activeIndex && !reducedMotion ? (
            <span
              key={`progress-${activeIndex}`}
              className="absolute inset-y-0 left-0 block rounded-full bg-white"
              style={{
                animation: `evx-hero-progress ${durationMs}ms linear forwards`,
                animationPlayState: isPaused ? "paused" : "running",
              }}
            />
          ) : i === activeIndex ? (
            <span className="absolute inset-0 block rounded-full bg-white" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
