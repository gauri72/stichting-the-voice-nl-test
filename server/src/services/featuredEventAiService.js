/**
 * Rule-based featured display suggestions (no external AI dependency).
 * Admin reviews suggestions before publishing.
 */

const WOMEN_KEYWORDS = /\b(women|woman|her|female|sister|vownl|herbeats)\b/i;
const CULTURAL_KEYWORDS = /\b(ghazal|cultural|festival|dance|music|international|heritage|diaspora)\b/i;
const CONCERT_KEYWORDS = /\b(concert|dj|night|beats|party|live)\b/i;
const FAMILY_KEYWORDS = /\b(family|community|kids|children|together)\b/i;

function inferDisplayMode(event) {
  const haystack = `${event.title || ""} ${event.description || ""} ${event.category || ""}`;
  if (WOMEN_KEYWORDS.test(haystack)) return "Women-focused";
  if (CULTURAL_KEYWORDS.test(haystack)) return "Cultural";
  if (CONCERT_KEYWORDS.test(haystack)) return "Concert/DJ";
  if (FAMILY_KEYWORDS.test(haystack)) return "Family/Community";
  if (event.featuredDisplayMode && event.featuredDisplayMode !== "Auto") {
    return event.featuredDisplayMode;
  }
  return "Cinematic";
}

function inferOverlayStrength(mode) {
  if (mode === "Light" || mode === "Elegant") return "Light";
  if (mode === "Women-focused" || mode === "Cultural") return "Strong";
  return "Medium";
}

function inferImageFocus(mode) {
  if (mode === "Concert/DJ") return "Center";
  if (mode === "Women-focused") return "Top";
  return "Center";
}

function buildSubtitle(event) {
  if (event.featuredSubtitle?.trim()) return event.featuredSubtitle.trim();
  const parts = [];
  if (event.venueName) parts.push(event.venueName);
  if (event.date) {
    const d = new Date(event.date);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      );
    }
  }
  return parts.join(" · ") || "An unforgettable community experience.";
}

export function generateFeaturedDisplayStyle(event) {
  const displayMode = inferDisplayMode(event);
  const overlayStrength = inferOverlayStrength(displayMode);
  const imageFocus = inferImageFocus(displayMode);

  const suggestion = {
    featuredDisplayMode: displayMode,
    featuredTextAlignment: displayMode === "Elegant" ? "Center" : "Left",
    featuredOverlayStrength: overlayStrength,
    featuredImageFocusPosition: imageFocus,
    featuredBadgeText: event.featuredBadgeText?.trim() || "Featured Event",
    featuredTitle: event.featuredTitle?.trim() || event.title,
    featuredSubtitle: buildSubtitle(event),
    featuredDescription:
      event.featuredDescription?.trim() ||
      event.description?.trim() ||
      "Join us for an inspiring evening with The V.O.I.C.E. NL community.",
    featuredCtaText: event.featuredCtaText?.trim() || "Book Tickets",
    aiSuggestedStyle: {
      model: "rule-based-v1",
      generatedAt: new Date().toISOString(),
      displayMode,
      overlayStrength,
      imageFocus,
      reasoning: `Suggested "${displayMode}" based on event title, description, and category.`,
    },
  };

  return suggestion;
}

export function generateFeaturedImagePrompt(event) {
  const mode = inferDisplayMode(event);
  const title = event.featuredTitle?.trim() || event.title || "Community Event";
  const venue = event.venueName || "Netherlands";
  const category = event.category || "community event";
  const moodMap = {
    "Women-focused":
      "women-focused cultural celebration, elegant stage lighting, warm magenta and gold tones, diverse women celebrating",
    Cultural: "rich cultural textures, stage lighting, authentic community atmosphere",
    "Concert/DJ": "dynamic concert lighting, crowd energy, neon accents",
    "Family/Community": "welcoming, inclusive, bright and friendly",
    Cinematic: "cinematic wide shot, dramatic lighting, premium editorial style",
    Elegant: "refined minimal composition, soft gradients, elegant typography space",
    Light: "bright airy atmosphere, natural light",
    Dark: "moody low-key lighting, deep contrast",
    Auto: "balanced community event atmosphere",
  };

  const mood = moodMap[mode] || moodMap.Cinematic;

  return {
    prompt: `Create a cinematic horizontal 16:9 hero image for a ${category} called "${title}" at ${venue}, using V.O.I.C.E. NL colors: deep navy, cyan, teal, purple and magenta. ${mood}. Premium celebration mood, no text, balanced composition with negative space on the left for headline text. Photorealistic, WEBP-ready.`,
    negativePrompt: "text, watermark, logo, blurry faces, distorted anatomy, low resolution",
    aspectRatio: "16:9",
    mobileAspectRatio: "4:3",
    recommendedStyle: mode,
    aiSuggestedStyle: {
      model: "rule-based-v1",
      generatedAt: new Date().toISOString(),
      purpose: "featured-hero-image",
    },
  };
}
