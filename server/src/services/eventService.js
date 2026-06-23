import crypto from "crypto";
import Event from "../models/Event.js";
import TicketType from "../models/TicketType.js";
import {
  enrichTicketType,
  resolveAvailableFrom,
  resolveAvailableUntil,
  sortTicketTypesForPublic,
} from "../utils/ticketTypeStatus.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function uniqueSlug(base) {
  let slug = slugify(base);
  if (!slug) slug = `event-${Date.now()}`;
  let candidate = slug;
  let n = 1;
  while (await Event.findOne({ slug: candidate }).select("_id").lean()) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

export function formatEvent(event, ticketTypes = []) {
  if (!event) return null;
  const id = event._id?.toString() || event.id;
  return {
    id,
    title: event.title,
    description: event.description,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    heroImage: event.heroImage || "",
    bookingFeeMinor: event.bookingFeeMinor || 0,
    salesEnabled: Boolean(event.salesEnabled),
    featured: Boolean(event.featured),
    showOnHomePage: Boolean(event.showOnHomePage),
    showOnEventsPage: Boolean(event.showOnEventsPage),
    featuredPriority: event.featuredPriority ?? 100,
    featuredHeroImageUrl: event.featuredHeroImageUrl || "",
    featuredMobileImageUrl: event.featuredMobileImageUrl || "",
    featuredImageAlt: event.featuredImageAlt || "",
    featuredTitle: event.featuredTitle || "",
    featuredSubtitle: event.featuredSubtitle || "",
    featuredDescription: event.featuredDescription || "",
    featuredBadgeText: event.featuredBadgeText || "Featured Event",
    featuredCtaText: event.featuredCtaText || "Book Tickets",
    featuredDisplayMode: event.featuredDisplayMode || "Auto",
    featuredTextAlignment: event.featuredTextAlignment || "Left",
    featuredOverlayStrength: event.featuredOverlayStrength || "Medium",
    featuredImageFocusPosition: event.featuredImageFocusPosition || "Center",
    aiSuggestedStyle: event.aiSuggestedStyle || null,
    showOnDashboard: event.showOnDashboard !== false,
    membershipIncluded: Boolean(event.membershipIncluded),
    membershipDiscountEligible: event.membershipDiscountEligible !== false,
    checkoutSettings: event.checkoutSettings || {
      enableMemberDiscount: true,
      enableMembershipUpsell: true,
      allowInstantMembershipBenefit: true,
      allowMembershipTicketBundle: true,
      eligibleMembershipTypes: [
        "student",
        "privilegedSingle",
        "privilegedFamily",
        "premiumSingle",
        "premiumFamily",
      ],
      allowDiscountStacking: true,
      showPriceComparisonPreview: true,
    },
    category: event.category || "Experience",
    archived: Boolean(event.archived),
    status: event.status,
    slug: event.slug,
    showInMemorableMoments: event.showInMemorableMoments !== false,
    highlightStatus: event.highlightStatus || "Coming Soon",
    highlightVideoType: event.highlightVideoType || "youtube_short",
    highlightVideoUrl: event.highlightVideoUrl || "",
    highlightEmbedUrl: event.highlightEmbedUrl || "",
    youtubeHighlightUrl: event.youtubeHighlightUrl || "",
    youtubeVideoId: event.youtubeVideoId || "",
    youtubeEmbedUrl: event.youtubeEmbedUrl || "",
    youtubeThumbnailUrl: event.youtubeThumbnailUrl || "",
    highlightTitle: event.highlightTitle || "",
    highlightSubtitle: event.highlightSubtitle || "",
    highlightDescription: event.highlightDescription || "",
    impactText: event.impactText || "",
    highlightThumbnailImageUrl: event.highlightThumbnailImageUrl || "",
    galleryUrl: event.galleryUrl || "",
    featuredHighlight: Boolean(event.featuredHighlight),
    highlightPriority: event.highlightPriority ?? 100,
    highlightUpdatedAt: event.highlightUpdatedAt || null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    ticketTypes: ticketTypes.map(formatTicketType),
  };
}

export function formatTicketType(tt, now = new Date()) {
  if (!tt) return null;
  const base = {
    id: tt._id?.toString() || tt.id,
    eventId: tt.eventId?.toString?.() || tt.eventId,
    name: tt.name,
    description: tt.description,
    priceMinor: tt.priceMinor,
    price: (tt.priceMinor / 100).toFixed(2),
    capacity: tt.capacity,
    soldCount: tt.soldCount || 0,
    maxPerOrder: tt.maxPerOrder,
    saleStartDate: resolveAvailableFrom(tt),
    saleEndDate: resolveAvailableUntil(tt),
    availableFrom: resolveAvailableFrom(tt),
    availableUntil: resolveAvailableUntil(tt),
    salesEnabled: tt.salesEnabled !== false,
    showPublicly: tt.showPublicly !== false,
    hideUntilAvailable: Boolean(tt.hideUntilAvailable),
    futureDisplayLabel: tt.futureDisplayLabel || "",
    soldOutDisplayMode: tt.soldOutDisplayMode || "show",
    status: tt.status,
    sortOrder: tt.sortOrder || 0,
  };
  return enrichTicketType(base, now);
}

export async function listEvents({ status, admin = false } = {}) {
  const filter = {};
  if (status) filter.status = status;
  else if (!admin) filter.status = "published";

  const events = await Event.find(filter).sort({ date: 1, createdAt: -1 }).lean();
  return events.map((e) => formatEvent(e));
}

export async function getEventById(eventId, { includeHiddenTypes = false } = {}) {
  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const typeFilter = { eventId: event._id };
  if (!includeHiddenTypes) {
    typeFilter.status = { $ne: "hidden" };
  }

  const ticketTypes = await TicketType.find(typeFilter).sort({ sortOrder: 1, createdAt: 1 }).lean();
  return formatEvent(event, ticketTypes);
}

export async function getPublishedEventBySlugOrId(idOrSlug) {
  let event = null;
  if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    event = await Event.findOne({ _id: idOrSlug, status: "published" }).lean();
  }
  if (!event) {
    event = await Event.findOne({ slug: idOrSlug, status: "published" }).lean();
  }
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const ticketTypes = await TicketType.find({ eventId: event._id })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const enriched = ticketTypes.map((tt) => formatTicketType(tt, now));
  const visibleTypes = sortTicketTypesForPublic(
    enriched.filter((tt) => tt.publiclyVisible)
  );

  return formatEvent(event, visibleTypes);
}

export async function createEvent(payload, adminId) {
  const {
    title,
    description,
    date,
    startTime,
    endTime,
    venueName,
    venueAddress,
    heroImage,
    bookingFeeMinor,
    salesEnabled,
    featured,
    showOnHomePage,
    showOnEventsPage,
    featuredPriority,
    featuredHeroImageUrl,
    featuredMobileImageUrl,
    featuredImageAlt,
    featuredTitle,
    featuredSubtitle,
    featuredDescription,
    featuredBadgeText,
    featuredCtaText,
    featuredDisplayMode,
    featuredTextAlignment,
    featuredOverlayStrength,
    featuredImageFocusPosition,
    aiSuggestedStyle,
    showOnDashboard,
    membershipIncluded,
    membershipDiscountEligible,
    category,
    archived,
    status,
    ticketTypes,
  } = payload;

  if (!title?.trim() || !date || !startTime?.trim() || !venueName?.trim() || !venueAddress?.trim()) {
    const err = new Error("Title, date, start time, venue name, and venue address are required.");
    err.status = 400;
    throw err;
  }

  const slug = await uniqueSlug(title);
  const event = await Event.create({
    title: title.trim(),
    description: String(description || "").trim(),
    date: new Date(date),
    startTime: startTime.trim(),
    endTime: String(endTime || "").trim(),
    venueName: venueName.trim(),
    venueAddress: String(venueAddress || "").trim(),
    heroImage: heroImage || "",
    bookingFeeMinor: Math.max(0, Number(bookingFeeMinor) || 0),
    salesEnabled: salesEnabled !== false,
    featured: Boolean(featured),
    showOnHomePage: Boolean(showOnHomePage),
    showOnEventsPage: Boolean(showOnEventsPage),
    featuredPriority: Math.max(0, Number(featuredPriority) || 100),
    featuredHeroImageUrl: featuredHeroImageUrl || "",
    featuredMobileImageUrl: featuredMobileImageUrl || "",
    featuredImageAlt: String(featuredImageAlt || "").trim(),
    featuredTitle: String(featuredTitle || "").trim(),
    featuredSubtitle: String(featuredSubtitle || "").trim(),
    featuredDescription: String(featuredDescription || "").trim(),
    featuredBadgeText: String(featuredBadgeText || "Featured Event").trim() || "Featured Event",
    featuredCtaText: String(featuredCtaText || "Book Tickets").trim() || "Book Tickets",
    featuredDisplayMode: featuredDisplayMode || "Auto",
    featuredTextAlignment: featuredTextAlignment || "Left",
    featuredOverlayStrength: featuredOverlayStrength || "Medium",
    featuredImageFocusPosition: featuredImageFocusPosition || "Center",
    aiSuggestedStyle: aiSuggestedStyle ?? null,
    showOnDashboard: showOnDashboard !== false,
    membershipIncluded: Boolean(membershipIncluded),
    membershipDiscountEligible: membershipDiscountEligible !== false,
    category: String(category || "Experience").trim() || "Experience",
    archived: Boolean(archived),
    status: status === "published" ? "published" : "draft",
    slug,
    createdBy: adminId || null,
  });

  if (Array.isArray(ticketTypes) && ticketTypes.length) {
    await upsertTicketTypes(event._id, ticketTypes);
  }

  return getEventById(event._id, { includeHiddenTypes: true });
}

export async function updateEvent(eventId, payload) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const merged = {
    title: payload.title !== undefined ? payload.title : event.title,
    date: payload.date !== undefined ? payload.date : event.date,
    startTime: payload.startTime !== undefined ? payload.startTime : event.startTime,
    venueName: payload.venueName !== undefined ? payload.venueName : event.venueName,
    venueAddress: payload.venueAddress !== undefined ? payload.venueAddress : event.venueAddress,
  };

  if (
    !String(merged.title || "").trim() ||
    !merged.date ||
    !String(merged.startTime || "").trim() ||
    !String(merged.venueName || "").trim() ||
    !String(merged.venueAddress || "").trim()
  ) {
    const err = new Error("Title, date, start time, venue name, and venue address are required.");
    err.status = 400;
    throw err;
  }

  const fields = [
    "title",
    "description",
    "date",
    "startTime",
    "endTime",
    "venueName",
    "venueAddress",
    "heroImage",
    "bookingFeeMinor",
    "salesEnabled",
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
    "showOnDashboard",
    "membershipIncluded",
    "membershipDiscountEligible",
    "checkoutSettings",
    "category",
    "archived",
    "status",
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

  for (const key of fields) {
    if (payload[key] !== undefined) {
      if (key === "date") event.date = new Date(payload.date);
      else if (key === "bookingFeeMinor") event.bookingFeeMinor = Math.max(0, Number(payload[key]) || 0);
      else if (
        key === "salesEnabled" ||
        key === "featured" ||
        key === "showOnHomePage" ||
        key === "showOnEventsPage" ||
        key === "showOnDashboard" ||
        key === "membershipIncluded" ||
        key === "membershipDiscountEligible" ||
        key === "archived" ||
        key === "showInMemorableMoments" ||
        key === "featuredHighlight"
      ) {
        event[key] = Boolean(payload[key]);
      } else if (key === "featuredPriority" || key === "highlightPriority") {
        event[key] = Math.max(0, Number(payload[key]) || 0);
      } else if (key === "aiSuggestedStyle") {
        event.aiSuggestedStyle = payload.aiSuggestedStyle;
      } else if (key === "checkoutSettings" && payload.checkoutSettings) {
        const current = event.checkoutSettings?.toObject?.() || event.checkoutSettings || {};
        event.checkoutSettings = { ...current, ...payload.checkoutSettings };
      } else if (key === "status") event.status = payload[key];
      else event[key] = String(payload[key] ?? "").trim();
    }
  }

  if (payload.title && payload.title.trim() !== event.title) {
    event.slug = await uniqueSlug(payload.title);
  }

  const { syncHighlightFieldsForEvent } = await import("./eventHighlightService.js");

  if (
    payload.youtubeHighlightUrl !== undefined ||
    payload.highlightVideoUrl !== undefined ||
    payload.highlightVideoType !== undefined
  ) {
    const { resolveHighlightVideo } = await import("../utils/highlightVideoUrl.js");
    const raw = payload.highlightVideoUrl ?? payload.youtubeHighlightUrl ?? payload.youtubeVideoId ?? "";
    const type = payload.highlightVideoType || event.highlightVideoType || "youtube_short";
    try {
      const parsed = resolveHighlightVideo(type, raw);
      event.highlightVideoType = parsed.highlightVideoType;
      event.highlightVideoUrl = parsed.highlightVideoUrl;
      event.highlightEmbedUrl = parsed.highlightEmbedUrl;
      event.youtubeHighlightUrl = parsed.youtubeHighlightUrl;
      event.youtubeVideoId = parsed.youtubeVideoId;
      event.youtubeEmbedUrl = parsed.youtubeEmbedUrl;
      event.youtubeThumbnailUrl = parsed.youtubeThumbnailUrl;
    } catch {
      /* validation handled by dedicated highlight endpoint */
    }
  }

  syncHighlightFieldsForEvent(event);
  if (
    payload.youtubeHighlightUrl !== undefined ||
    payload.highlightStatus !== undefined ||
    payload.showInMemorableMoments !== undefined
  ) {
    event.highlightUpdatedAt = new Date();
  }

  await event.save();

  if (Array.isArray(payload.ticketTypes)) {
    await upsertTicketTypes(event._id, payload.ticketTypes);
  }

  return getEventById(event._id, { includeHiddenTypes: true });
}

export async function patchEventFeaturedFlags(eventId, flags) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }

  const allowed = ["featured", "showOnHomePage", "showOnEventsPage"];
  for (const key of allowed) {
    if (flags[key] !== undefined) {
      event[key] = Boolean(flags[key]);
    }
  }

  if (event.featured && flags.featured !== false) {
    if (flags.showOnHomePage === undefined && !event.showOnHomePage && !event.showOnEventsPage) {
      event.showOnHomePage = true;
      event.showOnEventsPage = true;
    }
  }

  await event.save();
  return getEventById(eventId, { includeHiddenTypes: true });
}

export async function upsertTicketTypes(eventId, ticketTypes) {
  const existing = await TicketType.find({ eventId }).lean();
  const existingIds = new Set(existing.map((t) => t._id.toString()));
  const incomingIds = new Set();

  for (let i = 0; i < ticketTypes.length; i += 1) {
    const tt = ticketTypes[i];
    const availableFrom = tt.availableFrom || tt.saleStartDate || null;
    const availableUntil = tt.availableUntil || tt.saleEndDate || null;
    const showPublicly = tt.showPublicly !== false && (tt.status || "active") !== "hidden";
    const data = {
      eventId,
      name: String(tt.name || "").trim(),
      description: String(tt.description || "").trim(),
      priceMinor: Math.max(0, Math.round(Number(tt.priceMinor ?? tt.price * 100) || 0)),
      capacity: Math.max(0, Number(tt.capacity ?? tt.qty) || 0),
      maxPerOrder: Math.max(1, Number(tt.maxPerOrder) || 10),
      saleStartDate: availableFrom ? new Date(availableFrom) : null,
      saleEndDate: availableUntil ? new Date(availableUntil) : null,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      salesEnabled: tt.salesEnabled !== false,
      showPublicly,
      hideUntilAvailable: Boolean(tt.hideUntilAvailable),
      futureDisplayLabel: String(tt.futureDisplayLabel || "").trim(),
      soldOutDisplayMode: tt.soldOutDisplayMode || "show",
      status:
        tt.status ||
        (tt.visibility === "hide_completely" || tt.showPublicly === false || tt.enabled === false
          ? "hidden"
          : "active"),
      sortOrder: Number(tt.sortOrder ?? i),
    };

    if (!data.name) continue;

    const sold = existing.find((e) => e._id.toString() === tt.id)?.soldCount || 0;
    if (data.capacity > 0 && sold >= data.capacity) data.status = "sold_out";

    if (tt.id && existingIds.has(tt.id)) {
      incomingIds.add(tt.id);
      await TicketType.findByIdAndUpdate(tt.id, { $set: data });
    } else {
      const created = await TicketType.create({ ...data, soldCount: 0 });
      incomingIds.add(created._id.toString());
    }
  }

  for (const old of existing) {
    if (!incomingIds.has(old._id.toString()) && (old.soldCount || 0) === 0) {
      await TicketType.findByIdAndDelete(old._id);
    }
  }
}

export async function publishEvent(eventId) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  event.status = "published";
  await event.save();
  return getEventById(eventId, { includeHiddenTypes: true });
}

export async function saveEventDraft(eventId) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  event.status = "draft";
  await event.save();
  return getEventById(eventId, { includeHiddenTypes: true });
}

export async function deleteEvent(eventId) {
  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error("Event not found.");
    err.status = 404;
    throw err;
  }
  const soldTypes = await TicketType.countDocuments({ eventId, soldCount: { $gt: 0 } });
  if (soldTypes > 0) {
    const err = new Error("Cannot delete an event with sold tickets.");
    err.status = 400;
    throw err;
  }
  await TicketType.deleteMany({ eventId });
  await event.deleteOne();
  return { ok: true };
}

export function generateVerificationToken() {
  return crypto.randomUUID();
}
