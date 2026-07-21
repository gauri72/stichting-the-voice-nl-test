import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useEventShorts from "./useEventShorts.js";
import ShortsRow from "./ShortsRow.jsx";
import ShortsLightbox from "./ShortsLightbox.jsx";
import { useEventExperience } from "../EventExperienceContext.jsx";

export default function EventShortsSection() {
  const { t } = useTranslation(["eventExperience"]);
  const { featured, upcoming, loading, hasAny } = useEventShorts();
  const { highlightedShortId } = useEventExperience();
  const [activeId, setActiveId] = useState(null);

  const allShorts = useMemo(() => [...featured, ...upcoming], [featured, upcoming]);
  const activeIndex = allShorts.findIndex((e) => e.id === activeId);
  const activeEvent = activeIndex >= 0 ? allShorts[activeIndex] : null;

  const openLightbox = useCallback((event) => setActiveId(event.id), []);
  const closeLightbox = useCallback(() => setActiveId(null), []);
  const goPrev = useCallback(() => {
    if (!allShorts.length) return;
    setActiveId(allShorts[(activeIndex - 1 + allShorts.length) % allShorts.length].id);
  }, [allShorts, activeIndex]);
  const goNext = useCallback(() => {
    if (!allShorts.length) return;
    setActiveId(allShorts[(activeIndex + 1) % allShorts.length].id);
  }, [allShorts, activeIndex]);

  // Per the spec: if there are no Shorts at all, this section doesn't
  // appear. Loading state renders nothing rather than a flash of "empty".
  if (loading || !hasAny) return null;

  return (
    <section id="evx-shorts-section" aria-label={t("eventExperience:shorts.sectionAria")} className="mx-auto max-w-7xl px-0 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 px-4 text-2xl font-extrabold text-evx-heading sm:px-0 sm:text-3xl">
        {t("eventExperience:shorts.title")}
      </h2>

      <div className="flex flex-col gap-10">
        <ShortsRow
          label={t("eventExperience:shorts.featuredLabel")}
          events={featured}
          onOpenLightbox={openLightbox}
          highlightedShortId={highlightedShortId}
        />
        <ShortsRow
          label={t("eventExperience:shorts.upcomingLabel")}
          events={upcoming}
          onOpenLightbox={openLightbox}
          highlightedShortId={highlightedShortId}
        />
      </div>

      <ShortsLightbox event={activeEvent} onClose={closeLightbox} onPrev={goPrev} onNext={goNext} />
    </section>
  );
}
