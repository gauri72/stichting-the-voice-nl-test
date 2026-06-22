import Event from "../models/Event.js";

const FEATURED_PUBLIC_FIELDS =
  "title description date startTime endTime venueName venueAddress heroImage slug " +
  "featuredHeroImageUrl featuredMobileImageUrl featuredImageAlt featuredTitle featuredSubtitle " +
  "featuredDescription featuredBadgeText featuredCtaText featuredDisplayMode featuredTextAlignment " +
  "featuredOverlayStrength featuredImageFocusPosition featuredPriority membershipIncluded membershipDiscountEligible";

const FEATURED_FIELDS = [
  "featured",
  "showOnHomePage",
  "showOnEventsPage",
  "featuredPriority",
  "featuredHeroImageUrl",
  "featuredMobileImageUrl",
  "featuredImageAlt",
  "featuredTitle",
  "featuredSubtitle",
  "featuredDescription",
  "featuredBadgeText",
  "featuredCtaText",
  "featuredDisplayMode",
  "featuredTextAlignment",
  "featuredOverlayStrength",
  "featuredImageFocusPosition",
  "aiSuggestedStyle",
];

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function objectPositionFromFocus(focus) {
  const map = {
    Center: "center center",
    Top: "center top",
    Bottom: "center bottom",
    Left: "left center",
    Right: "right center",
  };
  return map[focus] || "center center";
}

export function formatFeaturedEvent(event) {
  if (!event) return null;

  const eventDate = event.date ? new Date(event.date) : null;
  const slug = event.slug || event._id?.toString();
  const heroImage = event.featuredHeroImageUrl || event.heroImage || "";
  const mobileImage = event.featuredMobileImageUrl || heroImage;

  return {
    id: event._id?.toString() || event.id,
    slug,
    title: event.title,
    description: event.description,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    heroImage: event.heroImage || "",
    featuredTitle: event.featuredTitle?.trim() || event.title,
    featuredSubtitle: event.featuredSubtitle?.trim() || "",
    featuredDescription: event.featuredDescription?.trim() || event.description || "",
    featuredBadgeText: event.featuredBadgeText?.trim() || "Featured Event",
    featuredCtaText: event.featuredCtaText?.trim() || "Book Tickets",
    featuredHeroImageUrl: heroImage,
    featuredMobileImageUrl: mobileImage,
    featuredImageAlt:
      event.featuredImageAlt?.trim() ||
      `${event.featuredTitle?.trim() || event.title} featured event banner`,
    featuredDisplayMode: event.featuredDisplayMode || "Auto",
    featuredTextAlignment: event.featuredTextAlignment || "Left",
    featuredOverlayStrength: event.featuredOverlayStrength || "Medium",
    featuredImageFocusPosition: event.featuredImageFocusPosition || "Center",
    imageObjectPosition: objectPositionFromFocus(event.featuredImageFocusPosition || "Center"),
    featuredPriority: event.featuredPriority ?? 100,
    membershipIncluded: Boolean(event.membershipIncluded),
    membershipDiscountEligible: event.membershipDiscountEligible !== false,
    ticketsUrl: `/events/${slug}/tickets`,
    detailsUrl: `/events/${slug}`,
    formattedDate: eventDate
      ? eventDate.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "",
    shortDate: eventDate
      ? {
          day: String(eventDate.getDate()).padStart(2, "0"),
          month: eventDate.toLocaleDateString("en-GB", { month: "short" }),
        }
      : { day: "", month: "" },
  };
}

export async function listFeaturedEvents(page) {
  const normalizedPage = String(page || "").toLowerCase();
  if (normalizedPage !== "home" && normalizedPage !== "events") {
    const err = new Error('Query parameter "page" must be "home" or "events".');
    err.status = 400;
    throw err;
  }

  const filter = {
    featured: true,
    status: "published",
    archived: { $ne: true },
    date: { $gte: startOfToday() },
  };

  if (normalizedPage === "home") {
    filter.showOnHomePage = true;
  } else {
    filter.showOnEventsPage = true;
  }

  const events = await Event.find(filter)
    .select(FEATURED_PUBLIC_FIELDS)
    .sort({ featuredPriority: 1, date: 1, createdAt: -1 })
    .lean();

  return events.map(formatFeaturedEvent);
}

export function pickFeaturedFields(payload = {}) {
  const picked = {};
  for (const key of FEATURED_FIELDS) {
    if (payload[key] !== undefined) {
      picked[key] = payload[key];
    }
  }
  return picked;
}

export { FEATURED_FIELDS };
