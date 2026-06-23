import {
  buildYoutubeEmbedUrl,
  buildYoutubeThumbnailUrl,
  buildYoutubeWatchUrl,
  extractYoutubeVideoId,
} from "./youtubeUrl.js";

function ensureUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  return value;
}

function parseYoutubePlaylistId(url) {
  const raw = ensureUrl(url);
  if (!raw) return "";
  const direct = raw.match(/(?:[?&]list=)([a-zA-Z0-9_-]+)/)?.[1];
  if (direct) return direct;
  if (/^[a-zA-Z0-9_-]{10,}$/.test(raw)) return raw;
  return "";
}

function parseVimeoId(url) {
  const raw = ensureUrl(url);
  const id = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || raw.match(/^(\d{6,})$/)?.[1];
  return id || "";
}

export function resolveHighlightVideo(type, url) {
  const normalizedType = String(type || "youtube_short").trim().toLowerCase();
  const rawUrl = ensureUrl(url);
  if (!rawUrl) {
    return {
      highlightVideoType: normalizedType,
      highlightVideoUrl: "",
      highlightEmbedUrl: "",
      youtubeVideoId: "",
      youtubeHighlightUrl: "",
      youtubeEmbedUrl: "",
      youtubeThumbnailUrl: "",
    };
  }

  if (normalizedType === "youtube_playlist") {
    const listId = parseYoutubePlaylistId(rawUrl);
    if (!listId) {
      const err = new Error("Please enter a valid YouTube playlist URL.");
      err.status = 400;
      throw err;
    }
    return {
      highlightVideoType: normalizedType,
      highlightVideoUrl: `https://www.youtube.com/playlist?list=${listId}`,
      highlightEmbedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}`,
      youtubeVideoId: "",
      youtubeHighlightUrl: "",
      youtubeEmbedUrl: "",
      youtubeThumbnailUrl: "",
    };
  }

  if (normalizedType === "vimeo") {
    const id = parseVimeoId(rawUrl);
    if (!id) {
      const err = new Error("Please enter a valid Vimeo URL.");
      err.status = 400;
      throw err;
    }
    return {
      highlightVideoType: normalizedType,
      highlightVideoUrl: `https://vimeo.com/${id}`,
      highlightEmbedUrl: `https://player.vimeo.com/video/${id}`,
      youtubeVideoId: "",
      youtubeHighlightUrl: "",
      youtubeEmbedUrl: "",
      youtubeThumbnailUrl: "",
    };
  }

  if (normalizedType === "internal") {
    return {
      highlightVideoType: normalizedType,
      highlightVideoUrl: rawUrl,
      highlightEmbedUrl: rawUrl,
      youtubeVideoId: "",
      youtubeHighlightUrl: "",
      youtubeEmbedUrl: "",
      youtubeThumbnailUrl: "",
    };
  }

  const videoId = extractYoutubeVideoId(rawUrl);
  if (!videoId) {
    const err = new Error("Please enter a valid YouTube video/shorts URL.");
    err.status = 400;
    throw err;
  }
  return {
    highlightVideoType: normalizedType === "youtube_video" ? "youtube_video" : "youtube_short",
    highlightVideoUrl: buildYoutubeWatchUrl(videoId),
    highlightEmbedUrl: buildYoutubeEmbedUrl(videoId),
    youtubeVideoId: videoId,
    youtubeHighlightUrl: buildYoutubeWatchUrl(videoId),
    youtubeEmbedUrl: buildYoutubeEmbedUrl(videoId),
    youtubeThumbnailUrl: buildYoutubeThumbnailUrl(videoId),
  };
}
