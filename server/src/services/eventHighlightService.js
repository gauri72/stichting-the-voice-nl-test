import Event from "../models/Event.js";
import { LEGACY_EVENT_HIGHLIGHTS } from "../data/legacyEventHighlights.js";
import {
  buildYoutubeEmbedUrl,
  buildYoutubeThumbnailUrl,
  buildYoutubeWatchUrl,
  extractYoutubeVideoId,
  parseYoutubeHighlightUrl,
} from "../utils/youtubeUrl.js";
import { resolveHighlightVideo } from "../utils/highlightVideoUrl.js";
import EventHighlightMetric from "../models/EventHighlightMetric.js";

const DEFAULT_IMPACT_TEXT =
  "An unforgettable V.O.I.C.E. NL experience filled with culture, connection and shared memories.";

const HIGHLIGHT_FIELDS = [
  "showInMemorableMoments",
  "highlightStatus",
  "highlightVideoType",
  "highlightVideoUrl",
  "highlightEmbedUrl",
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
  if (
    event.highlightEmbedUrl ||
    event.highlightVideoUrl ||
    event.youtubeVideoId ||
    extractYoutubeVideoId(event.youtubeHighlightUrl)
  ) {
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
  const videoType = event.highlightVideoType || (videoId ? "youtube_short" : "youtube_short");

  if (videoId) {
    event.youtubeVideoId = videoId;
    event.youtubeHighlightUrl = event.youtubeHighlightUrl || buildYoutubeWatchUrl(videoId);
    event.youtubeEmbedUrl = buildYoutubeEmbedUrl(videoId);
    event.youtubeThumbnailUrl = buildYoutubeThumbnailUrl(videoId);
    if (event.highlightStatus !== "Hidden") {
      event.highlightStatus = "Video Available";
    }
    if (!event.highlightVideoUrl) event.highlightVideoUrl = event.youtubeHighlightUrl;
    if (!event.highlightEmbedUrl) event.highlightEmbedUrl = event.youtubeEmbedUrl;
    if (!event.highlightVideoType) event.highlightVideoType = "youtube_short";
  } else if (event.highlightStatus !== "Hidden") {
    if (event.highlightEmbedUrl || event.highlightVideoUrl) {
      event.highlightStatus = "Video Available";
    } else {
      event.highlightStatus = "Coming Soon";
    }
  }
  if (!event.highlightVideoType) event.highlightVideoType = videoType;

  return event;
}

function formatHighlightCard(event, { legacy = false } = {}) {
  const videoId = event.youtubeVideoId || extractYoutubeVideoId(event.youtubeHighlightUrl) || "";
  const highlightVideoType = event.highlightVideoType || (videoId ? "youtube_short" : "youtube_short");
  const highlightEmbedUrl = event.highlightEmbedUrl || (videoId ? buildYoutubeEmbedUrl(videoId) : "");
  const highlightVideoUrl = event.highlightVideoUrl || event.youtubeHighlightUrl || "";
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
    highlightVideoType,
    highlightVideoUrl,
    highlightEmbedUrl,
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

  const sorted = sortHighlights(items);
  const metrics = await EventHighlightMetric.find({
    eventId: { $in: sorted.map((item) => item.eventId) },
  }).lean();
  const metricByEventId = new Map(metrics.map((m) => [String(m.eventId), m]));
  return sorted.map((item) => {
    const metric = metricByEventId.get(String(item.eventId));
    return {
      ...item,
      analytics: metric
        ? {
            highlightViews: metric.highlightViews || 0,
            modalOpens: metric.modalOpens || 0,
            videoPlays: metric.videoPlays || 0,
            completionRate:
              metric.completionEvents > 0
                ? Math.round((metric.completionRateTotal / metric.completionEvents) * 100) / 100
                : 0,
          }
        : {
            highlightViews: 0,
            modalOpens: 0,
            videoPlays: 0,
            completionRate: 0,
          },
    };
  });
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

  if (
    payload.youtubeHighlightUrl !== undefined ||
    payload.youtubeVideoId !== undefined ||
    payload.highlightVideoType !== undefined ||
    payload.highlightVideoUrl !== undefined
  ) {
    const type = payload.highlightVideoType || event.highlightVideoType || "youtube_short";
    const raw = payload.highlightVideoUrl ?? payload.youtubeHighlightUrl ?? payload.youtubeVideoId ?? "";
    const resolved = resolveHighlightVideo(type, raw);
    event.highlightVideoType = resolved.highlightVideoType;
    event.highlightVideoUrl = resolved.highlightVideoUrl;
    event.highlightEmbedUrl = resolved.highlightEmbedUrl;
    event.youtubeHighlightUrl = resolved.youtubeHighlightUrl;
    event.youtubeVideoId = resolved.youtubeVideoId;
    event.youtubeEmbedUrl = resolved.youtubeEmbedUrl;
    event.youtubeThumbnailUrl = resolved.youtubeThumbnailUrl;
    if (payload.highlightStatus !== "Hidden") {
      event.highlightStatus =
        resolved.highlightEmbedUrl || resolved.youtubeVideoId ? "Video Available" : "Coming Soon";
    }
    if (!event.highlightThumbnailImageUrl && resolved.youtubeThumbnailUrl) {
      event.highlightThumbnailImageUrl = resolved.youtubeThumbnailUrl;
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

export async function trackEventHighlightMetric(eventId, action, payload = {}) {
  if (!eventId || !action) return { ok: true };
  const inc = {};
  if (action === "highlight_view") inc.highlightViews = 1;
  if (action === "modal_open") inc.modalOpens = 1;
  if (action === "video_play") inc.videoPlays = 1;
  if (action === "completion_rate") {
    inc.completionEvents = 1;
    inc.completionRateTotal = Math.max(0, Math.min(100, Number(payload.completionRate) || 0));
  }
  await EventHighlightMetric.findOneAndUpdate(
    { eventId },
    { $inc: inc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { ok: true };
}

export async function getEventHighlightAnalyticsReport() {
  const metrics = await EventHighlightMetric.find({}).lean();
  const total = metrics.reduce(
    (acc, m) => {
      acc.highlightViews += m.highlightViews || 0;
      acc.modalOpens += m.modalOpens || 0;
      acc.videoPlays += m.videoPlays || 0;
      acc.completionEvents += m.completionEvents || 0;
      acc.completionRateTotal += m.completionRateTotal || 0;
      return acc;
    },
    { highlightViews: 0, modalOpens: 0, videoPlays: 0, completionEvents: 0, completionRateTotal: 0 }
  );
  const mostViewed = [...metrics]
    .sort((a, b) => (b.highlightViews || 0) - (a.highlightViews || 0))
    .slice(0, 10)
    .map((m) => ({
      eventId: String(m.eventId),
      highlightViews: m.highlightViews || 0,
      modalOpens: m.modalOpens || 0,
      videoPlays: m.videoPlays || 0,
      completionRate:
        (m.completionEvents || 0) > 0
          ? Math.round(((m.completionRateTotal || 0) / m.completionEvents) * 100) / 100
          : 0,
    }));
  return {
    totals: {
      ...total,
      completionRate:
        total.completionEvents > 0
          ? Math.round((total.completionRateTotal / total.completionEvents) * 100) / 100
          : 0,
    },
    mostViewed,
  };
}

export { HIGHLIGHT_FIELDS, DEFAULT_IMPACT_TEXT };
