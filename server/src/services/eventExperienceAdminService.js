import Event from "../models/Event.js";
import { parseYoutubeHighlightUrl } from "../utils/youtubeUrl.js";

// Admin-side support for the Event Experience page's youtubeShortUrl/etc.
// fields — deliberately separate from eventHighlightService.js, which owns
// the existing /events page's own, unrelated highlight video system.

export function previewYoutubeShort(url) {
  const parsed = parseYoutubeHighlightUrl(url);
  return {
    videoId: parsed.youtubeVideoId,
    thumbnailUrl: parsed.youtubeThumbnailUrl,
    watchUrl: parsed.youtubeHighlightUrl,
    embedUrl: parsed.youtubeEmbedUrl,
  };
}

export async function getEventShortFields(eventId) {
  const event = await Event.findById(eventId)
    .select("youtubeShortUrl youtubeShortVideoId youtubeThumbnail youtubeDuration featureInCarousel")
    .lean();

  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  return {
    youtubeShortUrl: event.youtubeShortUrl || "",
    youtubeShortVideoId: event.youtubeShortVideoId || "",
    youtubeThumbnail: event.youtubeThumbnail || "",
    youtubeDuration: event.youtubeDuration || 0,
    featureInCarousel: Boolean(event.featureInCarousel),
  };
}

export async function updateEventShortFields(eventId, fields = {}) {
  const update = {};
  if ("youtubeShortUrl" in fields) update.youtubeShortUrl = String(fields.youtubeShortUrl || "").trim();
  if ("youtubeShortVideoId" in fields) update.youtubeShortVideoId = String(fields.youtubeShortVideoId || "").trim();
  if ("youtubeThumbnail" in fields) update.youtubeThumbnail = String(fields.youtubeThumbnail || "").trim();
  if ("youtubeDuration" in fields) update.youtubeDuration = Math.max(0, Math.round(Number(fields.youtubeDuration) || 0));
  if ("featureInCarousel" in fields) update.featureInCarousel = Boolean(fields.featureInCarousel);

  const event = await Event.findByIdAndUpdate(eventId, { $set: update }, { new: true })
    .select("youtubeShortUrl youtubeShortVideoId youtubeThumbnail youtubeDuration featureInCarousel")
    .lean();

  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  return {
    youtubeShortUrl: event.youtubeShortUrl || "",
    youtubeShortVideoId: event.youtubeShortVideoId || "",
    youtubeThumbnail: event.youtubeThumbnail || "",
    youtubeDuration: event.youtubeDuration || 0,
    featureInCarousel: Boolean(event.featureInCarousel),
  };
}
