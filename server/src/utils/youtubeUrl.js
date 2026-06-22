const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const URL_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:[^&]+&)*v=|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

export function extractYoutubeVideoId(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  if (YOUTUBE_ID_PATTERN.test(raw)) return raw;

  for (const pattern of URL_PATTERNS) {
    const match = raw.match(pattern);
    if (match?.[1] && YOUTUBE_ID_PATTERN.test(match[1])) return match[1];
  }

  return null;
}

export function buildYoutubeEmbedUrl(videoId) {
  const id = extractYoutubeVideoId(videoId);
  if (!id) return "";
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function buildYoutubeWatchUrl(videoId) {
  const id = extractYoutubeVideoId(videoId);
  if (!id) return "";
  return `https://www.youtube.com/watch?v=${id}`;
}

export function buildYoutubeThumbnailUrl(videoId, quality = "hqdefault") {
  const id = extractYoutubeVideoId(videoId);
  if (!id) return "";
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

export function parseYoutubeHighlightUrl(url) {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    const err = new Error("Please enter a valid YouTube video link.");
    err.status = 400;
    throw err;
  }

  return {
    youtubeVideoId: videoId,
    youtubeHighlightUrl: buildYoutubeWatchUrl(videoId),
    youtubeEmbedUrl: buildYoutubeEmbedUrl(videoId),
    youtubeThumbnailUrl: buildYoutubeThumbnailUrl(videoId),
  };
}

export function isValidYoutubeUrl(url) {
  return Boolean(extractYoutubeVideoId(url));
}
