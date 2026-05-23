/**
 * Signature event highlight images in client/public/events-highlights/
 * Files: {index}.webp (1–574)
 */
export const EVENT_HIGHLIGHTS = {
  "shaam-e-ghazal": {
    title: "Shaam-e-Ghazal",
    start: 1,
    end: 52
  },
  "kncb-cricket-festival": {
    title: "KNCB Cricket Festival",
    start: 53,
    end: 64
  },
  "international-short-film-festival": {
    title: "International Short-Film Festival",
    start: 65,
    end: 124
  },
  "international-music-festival": {
    title: "International Music Festival",
    start: 125,
    end: 294
  },
  "international-dance-festival": {
    title: "International Dance Festival",
    start: 295,
    end: 533
  },
  "her-beats-her-night": {
    title: "Her Beats Her Night",
    start: 534,
    end: 574
  }
};

const HIGHLIGHTS_BASE = "/events-highlights";
const HIGHLIGHTS_EXT = "webp";

export function buildHighlightImageUrls({ start, end }) {
  const urls = [];
  for (let index = start; index <= end; index += 1) {
    urls.push(`${HIGHLIGHTS_BASE}/${index}.${HIGHLIGHTS_EXT}`);
  }
  return urls;
}

export function getHighlightGallery(highlightId) {
  const config = EVENT_HIGHLIGHTS[highlightId];
  if (!config) return null;
  return {
    title: config.title,
    images: buildHighlightImageUrls(config)
  };
}
