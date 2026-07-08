import Event from "../models/Event.js";
import TicketType from "../models/TicketType.js";
import { enrichTicketType } from "../utils/ticketTypeStatus.js";
import { escapeRegex } from "../utils/regexUtils.js";

// Backend for the new, standalone /event-experience page. Deliberately
// separate from eventService.js (the existing /events page's own formatter
// and routes) — this never touches that file's behavior.

function formatEur(minor) {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
      Number(minor) / 100
    );
  } catch {
    return `€${(Number(minor) / 100).toFixed(2)}`;
  }
}

function formatDisplayDate(isoOrDate) {
  if (!isoOrDate) return "";
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function computeAvailabilityBadge(enrichedTicketTypes) {
  const visible = enrichedTicketTypes.filter((tt) => tt.publiclyVisible !== false);
  if (!visible.length) return null;

  if (visible.every((tt) => tt.computedStatus === "SOLD_OUT")) return "Sold Out";

  const available = visible.filter((tt) => tt.computedStatus === "AVAILABLE");
  if (!available.length) return null;

  const cheapest = Math.min(...available.map((tt) => tt.priceMinor));
  if (cheapest === 0) return "Free";

  const totalCapacity = available.reduce((sum, tt) => sum + (tt.capacity || 0), 0);
  const totalRemaining = available.reduce((sum, tt) => sum + (tt.remainingCapacity || 0), 0);
  if (totalCapacity > 0) {
    const pctRemaining = totalRemaining / totalCapacity;
    if (pctRemaining <= 0.2) return "Selling Fast";
    if (pctRemaining <= 0.4) return "Few Tickets Left";
  }
  return null;
}

function formatEventExperienceCard(event, ticketTypes, now) {
  const enriched = (ticketTypes || []).map((tt) => enrichTicketType(tt, now));
  const visible = enriched.filter((tt) => tt.publiclyVisible !== false);
  const prices = visible.map((tt) => tt.priceMinor);
  const priceFrom = prices.length ? Math.min(...prices) : 0;
  const isFree = prices.length > 0 && priceFrom === 0;
  const soldCount = enriched.reduce((sum, tt) => sum + (tt.soldCount || 0), 0);

  return {
    id: event._id.toString(),
    slug: event.slug || "",
    title: event.title,
    description: event.description || "",
    date: event.date,
    dateLabel: formatDisplayDate(event.date),
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    venueName: event.venueName || "",
    venueAddress: event.venueAddress || "",
    category: event.category || "Experience",
    heroImage: event.heroImage || "",
    featuredHeroImageUrl: event.featuredHeroImageUrl || "",
    featuredMobileImageUrl: event.featuredMobileImageUrl || "",
    featuredTitle: event.featuredTitle || "",
    featuredSubtitle: event.featuredSubtitle || "",
    featuredDescription: event.featuredDescription || "",
    featuredBadgeText: event.featuredBadgeText || "",
    featuredCtaText: event.featuredCtaText || "",
    priceFrom,
    priceFromFormatted: prices.length ? formatEur(priceFrom) : "",
    isFree,
    availabilityBadge: computeAvailabilityBadge(visible),
    soldCount,
    hasVideo: Boolean(event.youtubeShortUrl),
    youtubeShortUrl: event.youtubeShortUrl || "",
    youtubeShortVideoId: event.youtubeShortVideoId || "",
    youtubeThumbnail: event.youtubeThumbnail || "",
    youtubeDuration: event.youtubeDuration || 0,
    featureInCarousel: Boolean(event.featureInCarousel),
  };
}

async function loadTicketTypesByEvent(eventIds) {
  const ticketTypes = eventIds.length
    ? await TicketType.find({ eventId: { $in: eventIds } }).lean()
    : [];
  const byEvent = new Map();
  for (const tt of ticketTypes) {
    const key = tt.eventId.toString();
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key).push(tt);
  }
  return byEvent;
}

export async function getFeaturedEvents({ limit = 8 } = {}) {
  const now = new Date();
  const events = await Event.find({ status: "published", featured: true, date: { $gte: now } })
    .sort({ featuredPriority: 1, date: 1 })
    .limit(Math.max(1, Math.min(Number(limit) || 8, 20)))
    .lean();

  const ticketsByEvent = await loadTicketTypesByEvent(events.map((e) => e._id));
  return events.map((event) =>
    formatEventExperienceCard(event, ticketsByEvent.get(event._id.toString()) || [], now)
  );
}

export async function getUpcomingEvents({
  page = 1,
  pageSize = 12,
  category = "",
  priceFilter = "all",
  location = "",
  hasVideo = false,
  dateFrom = "",
  dateTo = "",
  search = "",
  sort = "date",
} = {}) {
  const now = new Date();
  const match = { status: "published", date: { $gte: now } };

  if (category) match.category = category;
  if (location) match.venueName = { $regex: escapeRegex(location), $options: "i" };
  // $exists is required alongside $ne: "" — events created before this field
  // existed on the schema don't have it on the raw document at all, and a
  // bare { $ne: "" } treats a missing field as "not empty" (a real bug
  // caught while testing this live against the existing events collection).
  if (hasVideo === true || hasVideo === "true") match.youtubeShortUrl = { $exists: true, $ne: "" };
  if (dateFrom) match.date.$gte = new Date(dateFrom) > now ? new Date(dateFrom) : now;
  if (dateTo) match.date.$lte = new Date(dateTo);
  if (search) {
    const re = { $regex: escapeRegex(search), $options: "i" };
    match.$or = [{ title: re }, { venueName: re }, { category: re }];
  }

  const events = await Event.find(match).lean();
  const ticketsByEvent = await loadTicketTypesByEvent(events.map((e) => e._id));
  let cards = events.map((event) =>
    formatEventExperienceCard(event, ticketsByEvent.get(event._id.toString()) || [], now)
  );

  if (priceFilter === "free") cards = cards.filter((c) => c.isFree);
  else if (priceFilter === "paid") cards = cards.filter((c) => !c.isFree);

  switch (sort) {
    case "popularity":
      cards.sort((a, b) => b.soldCount - a.soldCount);
      break;
    case "price_asc":
      cards.sort((a, b) => a.priceFrom - b.priceFrom);
      break;
    case "price_desc":
      cards.sort((a, b) => b.priceFrom - a.priceFrom);
      break;
    default:
      cards.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const totalCount = cards.length;
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 12, 48));
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const safePage = Math.max(1, Math.min(Number(page) || 1, totalPages));
  const start = (safePage - 1) * safePageSize;

  // Facets are computed from the full published/upcoming set (unfiltered by
  // category/price/etc.) so the filter pills always show every option, not
  // just the ones matching the current filter selection.
  const allUpcoming = await Event.find({ status: "published", date: { $gte: now } })
    .select("category venueName")
    .lean();
  const categories = [...new Set(allUpcoming.map((e) => e.category).filter(Boolean))].sort();
  const locations = [...new Set(allUpcoming.map((e) => e.venueName).filter(Boolean))].sort();

  return {
    events: cards.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    totalCount,
    totalPages,
    facets: { categories, locations },
  };
}

export async function getEventShorts() {
  const now = new Date();
  const events = await Event.find({
    status: "published",
    youtubeShortUrl: { $exists: true, $ne: "" },
    date: { $gte: now },
  })
    .sort({ date: 1 })
    .lean();

  const ticketsByEvent = await loadTicketTypesByEvent(events.map((e) => e._id));
  const cards = events.map((event) =>
    formatEventExperienceCard(event, ticketsByEvent.get(event._id.toString()) || [], now)
  );

  return {
    featured: cards.filter((c) => c.featureInCarousel),
    upcoming: cards.filter((c) => !c.featureInCarousel),
  };
}

export async function getCalendarMonth({ year, month } = {}) {
  const now = new Date();
  const y = Number(year) || now.getFullYear();
  const m = Number(month) || now.getMonth() + 1; // 1-indexed
  const startOfMonth = new Date(y, m - 1, 1);
  const startOfNextMonth = new Date(y, m, 1);

  const events = await Event.find({
    status: "published",
    date: { $gte: startOfMonth, $lt: startOfNextMonth },
  })
    .sort({ date: 1 })
    .lean();

  const days = {};
  for (const event of events) {
    const dayKey = event.date.toISOString().slice(0, 10);
    if (!days[dayKey]) days[dayKey] = { count: 0, events: [], hasVideo: false, categories: [] };
    const entry = days[dayKey];
    const hasVideo = Boolean(event.youtubeShortUrl);
    entry.count += 1;
    entry.events.push({
      id: event._id.toString(),
      title: event.title,
      category: event.category || "Experience",
      startTime: event.startTime || "",
      hasVideo,
    });
    if (hasVideo) entry.hasVideo = true;
    if (event.category && !entry.categories.includes(event.category)) entry.categories.push(event.category);
  }

  return { year: y, month: m, days };
}
