import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { matchKnownLabelKey } from "../i18n/navLabels.js";
import { translateCmsText } from "../utils/cmsTextApi.js";

// Shared across all hook instances so the same admin-typed text isn't
// re-translated on every remount within a session.
const liveTranslationCache = new Map();

/**
 * Resolves an admin-editable CMS label (header CTA text, event CTA text,
 * etc.) to the current site language. Recognized defaults translate
 * instantly via the static locale files; custom admin text falls back to
 * a live AI translation (cached), since it isn't in any locale file.
 */
export function useCmsLabelTranslation(rawText, fallbackKey) {
  const { t, i18n } = useTranslation(["common", "events"]);
  const lang = i18n.language;
  const trimmed = String(rawText || "").trim();
  const knownKey = matchKnownLabelKey(trimmed);

  const baseText = knownKey ? t(knownKey) : trimmed || t(fallbackKey);
  const needsLiveTranslation = !knownKey && Boolean(trimmed) && lang !== "en";

  const [liveText, setLiveText] = useState(null);

  useEffect(() => {
    if (!needsLiveTranslation) {
      setLiveText(null);
      return undefined;
    }

    const cacheKey = `${lang}::${trimmed}`;
    if (liveTranslationCache.has(cacheKey)) {
      setLiveText(liveTranslationCache.get(cacheKey));
      return undefined;
    }

    let cancelled = false;
    translateCmsText(trimmed, lang)
      .then((translated) => {
        if (!translated) return;
        liveTranslationCache.set(cacheKey, translated);
        if (!cancelled) setLiveText(translated);
      })
      .catch(() => {
        // Leave the English text showing on failure.
      });

    return () => {
      cancelled = true;
    };
  }, [needsLiveTranslation, trimmed, lang]);

  return needsLiveTranslation && liveText ? liveText : baseText;
}
