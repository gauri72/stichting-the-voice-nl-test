import Event from "../models/Event.js";
import { LEGACY_EVENT_HIGHLIGHTS } from "../data/legacyEventHighlights.js";
import {
  buildYoutubeEmbedUrl,
  buildYoutubeThumbnailUrl,
  buildYoutubeWatchUrl,
  extractYoutubeVideoId,
  parseYoutubeHighlightUrl,
} from "../utils/youtubeUrl.js";

const DEFAULT_IMPACT_TEXT =
  "An unforgettable V.O.I.C.E. NL experience filled with culture, connection and shared memories.";

const HIGHLIGHT_FIELDS = [
  "showInMemorableMoments",
  "highlightStatus",
  "youtubeHighlightUrl",
  "youtubeVideoId",
  "youtubeEmbedUrl",
  "youtubeThumbnailUrl",
  "highlightTitle",
  "highlightSubtitle",
  "highlightDescription",
  "impactText",
  "highlightThumbnailImageUrl",
  "galleryUrl",
  "featuredHighlight",
  "highlightPriority",
];

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isEventCompleted(event) {
  if (!event?.date) return false;
  const eventDate = new Date(event.date);
  if (Number.isNaN(eventDate.getTime())) return false;
  return eventDate < startOfToday();
}

export function resolveHighlightStatus(event) {
  if (event.highlightStatus === "Hidden") return "Hidden";
  if (event.youtubeVideoId || extractYoutubeVideoId(event.youtubeHighlightUrl)) {
    return "Video Available";
  }
  return event.highlightStatus === "Coming Soon" ? "Coming Soon" : "Coming Soon";
}

export function syncHighlightFieldsForEvent(event) {
  if (!isEventCompleted(event) || event.status !== "published" || event.archived) {
    return event;
  }

  if (event.showInMemorableMoments === undefined || event.showInMemorableMoments === null) {
    event.showInMemorableMoments = true;
  }

  const videoId =
    event.youtubeVideoId || extractYoutubeVideoId(event.youtubeHighlightUrl) || "";

  if (videoId) {
    event.youtubeVideoId = videoId;
    event.youtubeHighlightUrl = event.youtubeHighlightUrl || buildYoutubeWatchUrl(videoId);
    event.youtubeEmbedUrl = buildYoutubeEmbedUrl(videoId);
    event.youtubeThumbnailUrl = buildYoutubeThumbnailUrl(videoId);
    if (event.highlightStatus !== "Hidden") {
      event.highlightStatus = "Video Available";
    }
  } else if (event.highlightStatus !== "Hidden") {
    event.highlightStatus = "Coming Soon";
  }

  return event;
}

function formatHighlightCard(event, { legacy = false } = {}) {
  const videoId = event.youtubeVideoId || extractYoutubeVideoId(event.youtubeHighlightUrl) || "";
  const status = resolveHighlightStatus(event);
  const eventDate = event.date ? new Date(event.date) : null;

  const thumbnailUrl =
    event.highlightThumbnailImageUrl ||
    event.youtubeThumbnailUrl ||
    (videoId ? buildYoutubeThumbnailUrl(videoId) : "") ||
    event.heroImage ||
    event.featuredHeroImageUrl ||
    "";

  const highlightTitle = event.highlightTitle?.trim() || event.title;
  const highlightDescription =
    event.highlightDescription?.trim() || event.description?.trim() || "";
  const impactText = event.impactText?.trim() || DEFAULT_IMPACT_TEXT;

  let badgeText = "Past Event";
  let ctaText = "View Memories";
  if (status === "Video Available" && videoId) {
    badgeText = "Watch Highlights";
    ctaText = "Watch Highlights";
  } else if (status === "Coming Soon") {
    badgeText = "Highlights Coming Soon";
    ctaText = "View Memories";
  } else if (videoId) {
    badgeText = "Video Available";
    ctaText = "Watch Highlights";
  }

  return {
    eventId: legacy ? `legacy-${event.slug}` : event._id?.toString() || event.id,
    slug: event.slug,
    title: event.title,
    date: event.date,
    formattedDate: eventDate
      ? eventDate.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })
      : event.highlightSubtitle || "",
    location: event.venueName || "",
    category: event.category || "Experience",
    highlightTitle,
    highlightSubtitle: event.highlightSubtitle?.trim() || "",
    highlightDescription,
    impactText,
    youtubeUrl: videoId ? buildYoutubeWatchUrl(videoId) : "",
    youtubeVideoId: videoId,
    youtubeEmbedUrl: videoId ? buildYoutubeEmbedUrl(videoId) : "",
    thumbnailUrl,
    galleryUrl: event.galleryUrl || "",
    highlightStatus: status,
    featuredHighlight: Boolean(event.featuredHighlight),
    highlightPriority: event.highlightPriority ?? 100,
    badgeText,
    ctaText,
    detailsUrl: event.slug ? `/events/${event.slug}` : "",
    legacy,
  };
}

function formatLegacyHighlight(legacy) {
  const videoId = legacy.youtubeVideoId;
  return formatHighlightCard(
    {
      ...legacy,
      youtubeVideoId: videoId,
      youtubeHighlightUrl: buildYoutubeWatchUrl(videoId),
      youtubeEmbedUrl: buildYoutubeEmbedUrl(videoId),
      youtubeThumbnailUrl: buildYoutubeThumbnailUrl(videoId),
      highlightStatus: videoId ? "Video Available" : "Coming Soon",
      showInMemorableMoments: true,
    },
    { legacy: true }
  );
}

function sortHighlights(items) {
  return [...items].sort((a, b) => {
    if (a.featuredHighlight !== b.featuredHighlight) {
      return a.featuredHighlight ? -1 : 1;
    }
    const priorityDiff = (a.highlightPriority ?? 100) - (b.highlightPriority ?? 100);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function listPublicEventHighlights(query = {}) {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 24));
  const featuredOnly = String(query.featuredOnly || "").toLowerCase() === "true";
  const year = query.year ? Number(query.year) : null;
  const category = query.category ? String(query.category).trim() : "";

  const dbEvents = await Event.find({
    status: "published",
    archived: { $ne: true },
    date: { $lt: startOfToday() },
    showInMemorableMoments: { $ne: false },
    highlightStatus: { $ne: "Hidden" },
  })
    .sort({ date: -1 })
    .lean();

  const dbSlugs = new Set(dbEvents.map((e) => e.slug).filter(Boolean));
  const dbHighlights = dbEvents.map((event) => formatHighlightCard(syncHighlightFieldsForEvent(event)));

  const legacyHighlights = LEGACY_EVENT_HIGHLIGHTS.filter((legacy) => !dbSlugs.has(legacy.slug)).map(
    formatLegacyHighlight
  );

  let combined = sortHighlights([...dbHighlights, ...legacyHighlights]);

  if (featuredOnly) {
    combined = combined.filter((item) => item.featuredHighlight);
  }
  if (year && !Number.isNaN(year)) {
    combined = combined.filter((item) => new Date(item.date).getFullYear() === year);
  }
  if (category) {
    const needle = category.toLowerCase();
    combined = combined.filter((item) => item.category.toLowerCase().includes(needle));
  }

  return combined.slice(0, limit);
}

export async function listAdminEventHighlights({ search = "", status = "", year = "", category = "" } = {}) {
  const events = await Event.find({
    status: "published",
    archived: { $ne: true },
    date: { $lt: startOfToday() },
  })
    .sort({ date: -1 })
    .lean();

  let items = events.map((event) => {
    const synced = syncHighlightFieldsForEvent({ ...event });
    return {
      ...formatHighlightCard(synced),
      showInMemorableMoments: synced.showInMemorableMoments !== false,
      highlightUpdatedAt: synced.highlightUpdatedAt || synced.updatedAt,
      adminFields: pickHighlightFields(synced),
    };
  });

  const needle = search.trim().toLowerCase();
  if (needle) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.location.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle)
    );
  }

  if (status && status !== "all") {
    items = items.filter((item) => {
      if (status === "featured") return item.featuredHighlight;
      if (status === "hidden") return item.highlightStatus === "Hidden";
      return item.highlightStatus === status;
    });
  }

  if (year) {
    const y = Number(year);
    if (!Number.isNaN(y)) {
      items = items.filter((item) => new Date(item.date).getFullYear() === y);
    }
  }

  if (category) {
    const cat = category.toLowerCase();
    items = items.filter((item) => item.category.toLowerCase().includes(cat));
  }

  return sortHighlights(items);
}

export async function getEventHighlightById(eventId) {
  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  const synced = syncHighlightFieldsForEvent({ ...event });
  return {
    event: formatEventHighlightAdmin(synced),
    public: formatHighlightCard(synced),
  };
}

export function formatEventHighlightAdmin(event) {
  return {
    eventId: event._id?.toString() || event.id,
    title: event.title,
    date: event.date,
    venueName: event.venueName,
    category: event.category,
    status: event.status,
    isCompleted: isEventCompleted(event),
    ...pickHighlightFields(event),
  };
}

export function pickHighlightFields(event = {}) {
  const picked = {};
  for (const key of HIGHLIGHT_FIELDS) {
    if (event[key] !== undefined) picked[key] = event[key];
  }
  return picked;
}

export async function patchEventHighlight(eventId, payload = {}) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  if (payload.youtubeHighlightUrl !== undefined || payload.youtubeVideoId !== undefined) {
    const raw = payload.youtubeHighlightUrl ?? payload.youtubeVideoId ?? "";
    if (String(raw).trim()) {
      const parsed = parseYoutubeHighlightUrl(raw);
      event.youtubeHighlightUrl = parsed.youtubeHighlightUrl;
      event.youtubeVideoId = parsed.youtubeVideoId;
      event.youtubeEmbedUrl = parsed.youtubeEmbedUrl;
      event.youtubeThumbnailUrl = parsed.youtubeThumbnailUrl;
      if (payload.highlightStatus !== "Hidden") {
        event.highlightStatus = "Video Available";
      }
    } else {
      event.youtubeHighlightUrl = "";
      event.youtubeVideoId = "";
      event.youtubeEmbedUrl = "";
      event.youtubeThumbnailUrl = "";
      if (payload.highlightStatus !== "Hidden") {
        event.highlightStatus = "Coming Soon";
      }
    }
  }

  for (const key of HIGHLIGHT_FIELDS) {
    if (key.startsWith("youtube") && (payload.youtubeHighlightUrl !== undefined || payload.youtubeVideoId !== undefined)) {
      continue;
    }
    if (payload[key] === undefined) continue;

    if (key === "showInMemorableMoments" || key === "featuredHighlight") {
      event[key] = Boolean(payload[key]);
    } else if (key === "highlightPriority") {
      event.highlightPriority = Math.max(0, Number(payload[key]) || 0);
    } else {
      event[key] = String(payload[key] ?? "").trim();
    }
  }

  syncHighlightFieldsForEvent(event);
  event.highlightUpdatedAt = new Date();
  await event.save();

  return getEventHighlightById(eventId);
}

export function previewYoutubeUrl(url) {
  return parseYoutubeHighlightUrl(url);
}

export { HIGHLIGHT_FIELDS, DEFAULT_IMPACT_TEXT };
