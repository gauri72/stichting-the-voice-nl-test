import { createContext, useCallback, useContext, useMemo, useState } from "react";
import useSavedEvents from "./shared/useSavedEvents.js";

const EventExperienceContext = createContext(null);

export function EventExperienceProvider({ children }) {
  const [highlightedShortId, setHighlightedShortId] = useState(null);
  const { isSaved, toggleSaved } = useSavedEvents();

  // Safe no-op until the Event Shorts section (Phase 3) actually renders an
  // element with this id — scrollIntoView simply does nothing if the target
  // isn't found yet, so this is safe to call from Phase 2 onward.
  const scrollToShort = useCallback((eventId) => {
    setHighlightedShortId(eventId);
    const target = document.getElementById(`evx-short-${eventId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      const section = document.getElementById("evx-shorts-section");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.setTimeout(() => setHighlightedShortId(null), 2500);
  }, []);

  const value = useMemo(
    () => ({ highlightedShortId, scrollToShort, isSaved, toggleSaved }),
    [highlightedShortId, scrollToShort, isSaved, toggleSaved]
  );

  return <EventExperienceContext.Provider value={value}>{children}</EventExperienceContext.Provider>;
}

export function useEventExperience() {
  const ctx = useContext(EventExperienceContext);
  if (!ctx) {
    throw new Error("useEventExperience must be used within EventExperienceProvider");
  }
  return ctx;
}
