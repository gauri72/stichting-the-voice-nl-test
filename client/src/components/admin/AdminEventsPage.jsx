import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconCalendar,
  IconCalendarEvent,
  IconClock,
  IconDeviceFloppy,
  IconExternalLink,
  IconMapPin,
  IconMap,
  IconPackage,
  IconPencil,
  IconPlus,
  IconTicket,
  IconTrash,
  IconUpload,
  IconSparkles,
  IconStar,
  IconStarOff,
  IconCopy,
  IconHome,
  IconLayoutGrid,
  IconVideo,
  IconWorldUpload,
  IconDots,
  IconSearch,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-events-page.css";

const FEATURED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FEATURED_IMAGE_MIN_WIDTH = 1280;
const FEATURED_IMAGE_MIN_HEIGHT = 720;
const FEATURED_IMAGE_MAX_BYTES = 6 * 1024 * 1024;

const DISPLAY_MODES = [
  "Auto",
  "Light",
  "Dark",
  "Cinematic",
  "Elegant",
  "Women-focused",
  "Cultural",
  "Concert/DJ",
  "Family/Community",
];

const TEXT_ALIGNMENTS = ["Left", "Center", "Right"];
const OVERLAY_STRENGTHS = ["Light", "Medium", "Strong"];
const IMAGE_FOCUS_POSITIONS = ["Center", "Top", "Bottom", "Left", "Right"];

const EMPTY_TICKET = {
  name: "",
  description: "",
  price: "",
  capacity: 100,
  maxPerOrder: 10,
  saleStartDate: "",
  saleEndDate: "",
  status: "active",
};

const EMPTY_EVENT = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  venueName: "",
  venueAddress: "",
  heroImage: "",
  bookingFee: "",
  salesEnabled: true,
  featured: false,
  showOnHomePage: false,
  showOnEventsPage: false,
  featuredPriority: 100,
  featuredHeroImageUrl: "",
  featuredMobileImageUrl: "",
  featuredImageAlt: "",
  featuredTitle: "",
  featuredSubtitle: "",
  featuredDescription: "",
  featuredBadgeText: "Featured Event",
  featuredCtaText: "Book Tickets",
  featuredDisplayMode: "Auto",
  featuredTextAlignment: "Left",
  featuredOverlayStrength: "Medium",
  featuredImageFocusPosition: "Center",
  aiSuggestedStyle: null,
  showInMemorableMoments: true,
  highlightStatus: "Coming Soon",
  highlightVideoType: "youtube_short",
  highlightVideoUrl: "",
  youtubeHighlightUrl: "",
  youtubeVideoId: "",
  highlightTitle: "",
  highlightSubtitle: "",
  highlightDescription: "",
  impactText: "",
  highlightThumbnailImageUrl: "",
  galleryUrl: "",
  featuredHighlight: false,
  highlightPriority: 100,
  showOnDashboard: true,
  membershipIncluded: false,
  membershipDiscountEligible: true,
  checkoutSettings: {
    enableMemberDiscount: true,
    enableMembershipUpsell: true,
    allowInstantMembershipBenefit: true,
    allowMembershipTicketBundle: true,
    allowDiscountStacking: true,
    showPriceComparisonPreview: true,
  },
  category: "Experience",
  ticketTypes: [
    { ...EMPTY_TICKET, name: "Early Bird", description: "Limited early access pricing", price: "29" },
    { ...EMPTY_TICKET, name: "Regular", description: "Standard entry ticket", price: "45" },
    { ...EMPTY_TICKET, name: "VIP", description: "Premium experience access", price: "89", capacity: 50 },
    { ...EMPTY_TICKET, name: "VVIP", description: "Exclusive all-access pass", price: "149", capacity: 25 },
  ],
};

function toLocalDateValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalDateTimeValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function normalizeTimeValue(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function toFormEvent(event) {
  if (!event) return { ...EMPTY_EVENT, ticketTypes: EMPTY_EVENT.ticketTypes.map((t) => ({ ...t })) };
  return {
    title: event.title || "",
    description: event.description || "",
    date: toLocalDateValue(event.date),
    startTime: normalizeTimeValue(event.startTime),
    endTime: normalizeTimeValue(event.endTime),
    venueName: event.venueName || "",
    venueAddress: event.venueAddress || "",
    heroImage: event.heroImage || "",
    bookingFee: event.bookingFeeMinor ? (event.bookingFeeMinor / 100).toFixed(2) : "",
    salesEnabled: event.salesEnabled !== false,
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
    showInMemorableMoments: event.showInMemorableMoments !== false,
    highlightStatus: event.highlightStatus || "Coming Soon",
    highlightVideoType: event.highlightVideoType || "youtube_short",
    highlightVideoUrl: event.highlightVideoUrl || event.youtubeHighlightUrl || "",
    youtubeHighlightUrl: event.youtubeHighlightUrl || "",
    youtubeVideoId: event.youtubeVideoId || "",
    highlightTitle: event.highlightTitle || "",
    highlightSubtitle: event.highlightSubtitle || "",
    highlightDescription: event.highlightDescription || "",
    impactText: event.impactText || "",
    highlightThumbnailImageUrl: event.highlightThumbnailImageUrl || "",
    galleryUrl: event.galleryUrl || "",
    featuredHighlight: Boolean(event.featuredHighlight),
    highlightPriority: event.highlightPriority ?? 100,
    showOnDashboard: event.showOnDashboard !== false,
    membershipIncluded: Boolean(event.membershipIncluded),
    membershipDiscountEligible: event.membershipDiscountEligible !== false,
    checkoutSettings: {
      enableMemberDiscount: event.checkoutSettings?.enableMemberDiscount !== false,
      enableMembershipUpsell: event.checkoutSettings?.enableMembershipUpsell !== false,
      allowInstantMembershipBenefit: event.checkoutSettings?.allowInstantMembershipBenefit !== false,
      allowMembershipTicketBundle: event.checkoutSettings?.allowMembershipTicketBundle !== false,
      allowDiscountStacking: event.checkoutSettings?.allowDiscountStacking !== false,
      showPriceComparisonPreview: event.checkoutSettings?.showPriceComparisonPreview !== false,
    },
    category: event.category || "Experience",
    ticketTypes: (event.ticketTypes || []).map((tt) => ({
      id: tt.id,
      name: tt.name,
      description: tt.description || "",
      price: tt.priceMinor != null ? (tt.priceMinor / 100).toFixed(2) : tt.price || "",
      capacity: tt.capacity,
      maxPerOrder: tt.maxPerOrder || 10,
      saleStartDate: toLocalDateTimeValue(tt.saleStartDate),
      saleEndDate: toLocalDateTimeValue(tt.saleEndDate),
      status: tt.status || "active",
    })),
  };
}

function toPayload(form, status) {
  return {
    title: form.title.trim(),
    description: form.description,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    venueName: form.venueName.trim(),
    venueAddress: form.venueAddress.trim(),
    heroImage: form.heroImage,
    bookingFeeMinor: Math.round((Number(form.bookingFee) || 0) * 100),
    salesEnabled: form.salesEnabled,
    featured: form.featured,
    showOnHomePage: form.showOnHomePage,
    showOnEventsPage: form.showOnEventsPage,
    featuredPriority: Number(form.featuredPriority) || 100,
    featuredHeroImageUrl: form.featuredHeroImageUrl,
    featuredMobileImageUrl: form.featuredMobileImageUrl,
    featuredImageAlt: form.featuredImageAlt,
    featuredTitle: form.featuredTitle,
    featuredSubtitle: form.featuredSubtitle,
    featuredDescription: form.featuredDescription,
    featuredBadgeText: form.featuredBadgeText,
    featuredCtaText: form.featuredCtaText,
    featuredDisplayMode: form.featuredDisplayMode,
    featuredTextAlignment: form.featuredTextAlignment,
    featuredOverlayStrength: form.featuredOverlayStrength,
    featuredImageFocusPosition: form.featuredImageFocusPosition,
    aiSuggestedStyle: form.aiSuggestedStyle,
    showInMemorableMoments: form.showInMemorableMoments,
    highlightStatus: form.highlightStatus,
    highlightVideoType: form.highlightVideoType,
    highlightVideoUrl: form.highlightVideoUrl,
    youtubeHighlightUrl: form.youtubeHighlightUrl,
    youtubeVideoId: form.youtubeVideoId,
    highlightTitle: form.highlightTitle,
    highlightSubtitle: form.highlightSubtitle,
    highlightDescription: form.highlightDescription,
    impactText: form.impactText,
    highlightThumbnailImageUrl: form.highlightThumbnailImageUrl,
    galleryUrl: form.galleryUrl,
    featuredHighlight: form.featuredHighlight,
    highlightPriority: Number(form.highlightPriority) || 100,
    showOnDashboard: form.showOnDashboard,
    membershipIncluded: form.membershipIncluded,
    membershipDiscountEligible: form.membershipDiscountEligible,
    checkoutSettings: form.checkoutSettings,
    category: form.category?.trim() || "Experience",
    status,
    ticketTypes: form.ticketTypes.map((tt, i) => ({
      id: tt.id,
      name: tt.name,
      description: tt.description,
      priceMinor: Math.round((Number(tt.price) || 0) * 100),
      capacity: Number(tt.capacity) || 0,
      maxPerOrder: Number(tt.maxPerOrder) || 10,
      saleStartDate: tt.saleStartDate || null,
      saleEndDate: tt.saleEndDate || null,
      status: tt.status,
      sortOrder: i,
    })),
  };
}

function validateEventForm(form) {
  const errors = {};

  if (!form.title?.trim()) errors.title = "Event title is required.";
  if (!form.date) errors.date = "Event date is required.";
  if (!form.startTime?.trim()) errors.startTime = "Start time is required.";
  if (!form.venueName?.trim()) errors.venueName = "Venue name is required.";
  if (!form.venueAddress?.trim()) errors.venueAddress = "Venue address is required.";

  return { valid: Object.keys(errors).length === 0, errors };
}

function openPicker(input) {
  if (!input) return;
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      /* showPicker requires a direct user gesture in some browsers */
    }
  }
  input.focus();
}

function blockManualDateTimeEntry(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const allowed = new Set([
    "Tab",
    "Enter",
    "Escape",
    " ",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
  ]);

  if (allowed.has(event.key)) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker(event.currentTarget);
    }
    return;
  }

  if (event.key.length === 1) {
    event.preventDefault();
  }
}

function PickerField({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  required = false,
  error,
}) {
  const isTime = type === "time";
  const isDateTime = type === "datetime-local";
  const errorId = error && id ? `${id}-error` : undefined;

  const handleChange = (event) => {
    onChange(event);
  };

  return (
    <div className="admin-events__field">
      {label ? (
        <label className="admin-events__label" htmlFor={id}>
          {label} {required ? <span className="admin-events__required">*</span> : null}
        </label>
      ) : null}
      <div
        className={`admin-events__input-icon-wrap admin-events__input-icon-wrap--picker${isTime ? " admin-events__input-icon-wrap--time" : ""}${isDateTime ? " admin-events__input-icon-wrap--datetime" : ""}`}
      >
        <Icon size={18} aria-hidden />
        <input
          id={id}
          type={type}
          className={`admin-events__input admin-events__input--with-icon admin-events__input--picker-only${error ? " admin-events__input--error" : ""}`}
          value={value}
          onChange={handleChange}
          onInput={handleChange}
          onFocus={(event) => openPicker(event.currentTarget)}
          onKeyDown={blockManualDateTimeEntry}
          onPaste={(event) => event.preventDefault()}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        />
      </div>
      {error ? (
        <p id={errorId} className="admin-events__field-error" role="alert">{error}</p>
      ) : null}
    </div>
  );
}

function renderEventBadges(ev, { readOnly = false } = {}) {
  return (
    <div className="admin-events__event-badges">
      <span className={`admin-events__status-badge admin-events__status-badge--${ev.status}`}>
        {ev.status}
      </span>
      {ev.featured ? (
        <span className="admin-events__source-badge admin-events__source-badge--featured">Featured</span>
      ) : null}
      {ev.showOnHomePage ? (
        <span className="admin-events__source-badge admin-events__source-badge--home">Home</span>
      ) : null}
      {ev.showOnEventsPage ? (
        <span className="admin-events__source-badge admin-events__source-badge--events">Events</span>
      ) : null}
      {readOnly ? <span className="admin-events__source-badge">TicketTailor</span> : null}
    </div>
  );
}

function AdminEventCardActions({
  ev,
  readOnly,
  deletingId,
  onEdit,
  onDelete,
  onPatchFeatured,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDocClick() {
      setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  if (readOnly) {
    return (
      <div className="admin-events__event-card-actions">
        {ev.bookingUrl ? (
          <a
            href={ev.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-events__action-btn admin-events__action-btn--primary admin-events__action-btn--mobile-primary"
          >
            <IconExternalLink size={16} aria-hidden />
            <span>View on TicketTailor</span>
          </a>
        ) : (
          <span className="admin-events__tt-note">Synced from TicketTailor</span>
        )}
      </div>
    );
  }

  return (
    <div className="admin-events__event-card-actions">
      <button
        type="button"
        className="admin-events__action-btn admin-events__action-btn--primary admin-events__action-btn--mobile-primary"
        onClick={onEdit}
      >
        <IconPencil size={16} aria-hidden />
        <span>Edit</span>
      </button>
      {ev.status === "published" ? (
        <Link
          to={`/events/${ev.slug || ev.id}/tickets`}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-events__action-btn admin-events__action-btn--mobile-primary"
        >
          <IconExternalLink size={16} aria-hidden />
          <span>Booking</span>
        </Link>
      ) : null}
      <div className="admin-events__action-more-wrap">
        <button
          type="button"
          className="admin-events__action-btn admin-events__action-btn--more"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <IconDots size={18} aria-hidden />
          <span>More</span>
        </button>
        {menuOpen ? (
          <div className="admin-events__action-menu" role="menu" onClick={(e) => e.stopPropagation()}>
            <Link
              to={`/admin/events?id=${ev.id}#post-event-highlights`}
              className="admin-events__action-menu-item"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <IconVideo size={16} aria-hidden />
              <span>Highlights</span>
            </Link>
            <button
              type="button"
              className="admin-events__action-menu-item"
              role="menuitem"
              onClick={() => {
                onPatchFeatured({
                  featured: !ev.featured,
                  ...(ev.featured ? {} : { showOnHomePage: true, showOnEventsPage: true }),
                });
                setMenuOpen(false);
              }}
            >
              {ev.featured ? <IconStarOff size={16} aria-hidden /> : <IconStar size={16} aria-hidden />}
              <span>{ev.featured ? "Remove Featured" : "Mark Featured"}</span>
            </button>
            <button
              type="button"
              className="admin-events__action-menu-item"
              role="menuitem"
              onClick={() => {
                onPatchFeatured({ showOnHomePage: !ev.showOnHomePage, featured: ev.featured || true });
                setMenuOpen(false);
              }}
            >
              <IconHome size={16} aria-hidden />
              <span>{ev.showOnHomePage ? "Hide from Home" : "Show on Home"}</span>
            </button>
            <button
              type="button"
              className="admin-events__action-menu-item"
              role="menuitem"
              onClick={() => {
                onPatchFeatured({ showOnEventsPage: !ev.showOnEventsPage, featured: ev.featured || true });
                setMenuOpen(false);
              }}
            >
              <IconLayoutGrid size={16} aria-hidden />
              <span>{ev.showOnEventsPage ? "Hide from Events" : "Show on Events"}</span>
            </button>
            {ev.status === "published" && ev.slug ? (
              <Link
                to={`/events/${ev.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-events__action-menu-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <IconExternalLink size={16} aria-hidden />
                <span>View Public Page</span>
              </Link>
            ) : null}
            <button
              type="button"
              className="admin-events__action-menu-item admin-events__action-menu-item--danger"
              role="menuitem"
              disabled={deletingId === ev.id}
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              <IconTrash size={16} aria-hidden />
              <span>{deletingId === ev.id ? "Deleting…" : "Delete"}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="admin-events__event-card-actions-desktop">
        <Link
          to={`/admin/events?id=${ev.id}#post-event-highlights`}
          className="admin-events__action-btn"
        >
          <IconVideo size={16} aria-hidden />
          <span>Highlights</span>
        </Link>
        <button
          type="button"
          className="admin-events__action-btn"
          onClick={() =>
            onPatchFeatured({
              featured: !ev.featured,
              ...(ev.featured ? {} : { showOnHomePage: true, showOnEventsPage: true }),
            })
          }
        >
          {ev.featured ? <IconStarOff size={16} aria-hidden /> : <IconStar size={16} aria-hidden />}
          <span>{ev.featured ? "Unfeature" : "Feature"}</span>
        </button>
        <button
          type="button"
          className={`admin-events__action-btn${ev.showOnHomePage ? " admin-events__action-btn--primary" : ""}`}
          onClick={() => onPatchFeatured({ showOnHomePage: !ev.showOnHomePage, featured: ev.featured || true })}
        >
          <IconHome size={16} aria-hidden />
          <span>Home</span>
        </button>
        <button
          type="button"
          className={`admin-events__action-btn${ev.showOnEventsPage ? " admin-events__action-btn--primary" : ""}`}
          onClick={() => onPatchFeatured({ showOnEventsPage: !ev.showOnEventsPage, featured: ev.featured || true })}
        >
          <IconLayoutGrid size={16} aria-hidden />
          <span>Events</span>
        </button>
        <button type="button" className="admin-events__action-btn admin-events__action-btn--primary" onClick={onEdit}>
          <IconPencil size={16} aria-hidden />
          <span>Edit</span>
        </button>
        {ev.status === "published" ? (
          <Link
            to={`/events/${ev.slug || ev.id}/tickets`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-events__action-btn"
          >
            <IconExternalLink size={16} aria-hidden />
            <span>Booking</span>
          </Link>
        ) : null}
        <button
          type="button"
          className="admin-events__action-btn admin-events__action-btn--danger"
          disabled={deletingId === ev.id}
          onClick={onDelete}
        >
          <IconTrash size={16} aria-hidden />
          <span>{deletingId === ev.id ? "Deleting…" : "Delete"}</span>
        </button>
      </div>
    </div>
  );
}

function AdminEventListSkeleton() {
  return (
    <ul className="admin-events__event-list admin-events__event-list--skeleton" aria-hidden>
      {[0, 1, 2].map((key) => (
        <li key={key} className="admin-events__event-card admin-events__event-card--skeleton">
          <div className="admin-events__skeleton-chip" />
          <div className="admin-events__skeleton-lines">
            <div className="admin-events__skeleton-line admin-events__skeleton-line--title" />
            <div className="admin-events__skeleton-line" />
            <div className="admin-events__skeleton-line admin-events__skeleton-line--short" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const [events, setEvents] = useState([]);
  const [ticketTailorEvents, setTicketTailorEvents] = useState([]);
  const [eventCounts, setEventCounts] = useState(null);
  const [ticketTailorMeta, setTicketTailorMeta] = useState(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAction, setSavingAction] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [aiLoading, setAiLoading] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [youtubePreviewLoading, setYoutubePreviewLoading] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [listFilter, setListFilter] = useState("all");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/events", { headers: adminAuthHeaders() });
      setEvents(data.events || []);
      setTicketTailorEvents(data.ticketTailorEvents || []);
      setEventCounts(data.counts || null);
      setTicketTailorMeta(data.ticketTailorMeta || null);
    } catch (err) {
      setError(err.message || "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvent = useCallback(async (id) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/admin/events/${id}`, { headers: adminAuthHeaders() });
      setForm(toFormEvent(data.event));
    } catch (err) {
      setError(err.message || "Could not load event.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setFieldErrors({});
    setError("");
    setMessage("");

    if (editId && editId !== "new") {
      loadEvent(editId);
    } else if (!editId) {
      loadEvents();
    } else {
      setForm({ ...EMPTY_EVENT, ticketTypes: EMPTY_EVENT.ticketTypes.map((t) => ({ ...t })) });
      setLoading(false);
    }
  }, [editId, loadEvent, loadEvents]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function updateTicket(index, key, value) {
    setForm((f) => {
      const ticketTypes = [...f.ticketTypes];
      ticketTypes[index] = { ...ticketTypes[index], [key]: value };
      return { ...f, ticketTypes };
    });
  }

  function addTicketType() {
    setForm((f) => ({ ...f, ticketTypes: [...f.ticketTypes, { ...EMPTY_TICKET }] }));
  }

  function removeTicketType(index) {
    setForm((f) => ({
      ...f,
      ticketTypes: f.ticketTypes.filter((_, i) => i !== index),
    }));
  }

  function handleHighlightThumbnailUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField("highlightThumbnailImageUrl", reader.result);
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function previewYoutubeUrl(url) {
    if (!editId || editId === "new" || !url?.trim()) {
      setYoutubePreview(null);
      return;
    }
    setYoutubePreviewLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/admin/events/${editId}/highlight/preview-youtube`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ url }),
      });
      setYoutubePreview(data.preview);
      updateField("youtubeVideoId", data.preview.youtubeVideoId);
      setMessage("YouTube link validated.");
    } catch (err) {
      setYoutubePreview(null);
      setError(err.message || "Please enter a valid YouTube video link.");
    } finally {
      setYoutubePreviewLoading(false);
    }
  }

  function handleFeaturedImageUpload(key, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!FEATURED_IMAGE_TYPES.includes(file.type)) {
      setError("Featured image must be JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > FEATURED_IMAGE_MAX_BYTES) {
      setError("Featured image must be smaller than 6 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        if (img.width < FEATURED_IMAGE_MIN_WIDTH || img.height < FEATURED_IMAGE_MIN_HEIGHT) {
          setError(`Featured image must be at least ${FEATURED_IMAGE_MIN_WIDTH}×${FEATURED_IMAGE_MIN_HEIGHT}px (16:9 recommended).`);
          return;
        }
        setError("");
        updateField(key, dataUrl);
      };
      img.onerror = () => setError("Could not read featured image.");
      img.src = dataUrl;
    };
    reader.onerror = () => setError("Could not read featured image.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function patchFeaturedFlag(eventId, flags) {
    setError("");
    setMessage("");
    try {
      const data = await apiFetch(`/api/admin/events/${eventId}/featured-flags`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(flags),
      });
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, ...data.event } : ev)));
      setMessage("Featured settings updated.");
      window.setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Could not update featured settings.");
    }
  }

  async function applyAiFeaturedStyle() {
    if (!editId || editId === "new") return;
    setAiLoading("style");
    setAiMessage("");
    setError("");
    try {
      const data = await apiFetch(`/api/admin/events/${editId}/ai/featured-style`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      const suggestion = data.suggestion || {};
      setForm((f) => ({
        ...f,
        featuredDisplayMode: suggestion.featuredDisplayMode || f.featuredDisplayMode,
        featuredTextAlignment: suggestion.featuredTextAlignment || f.featuredTextAlignment,
        featuredOverlayStrength: suggestion.featuredOverlayStrength || f.featuredOverlayStrength,
        featuredImageFocusPosition: suggestion.featuredImageFocusPosition || f.featuredImageFocusPosition,
        featuredBadgeText: suggestion.featuredBadgeText || f.featuredBadgeText,
        featuredTitle: suggestion.featuredTitle || f.featuredTitle,
        featuredSubtitle: suggestion.featuredSubtitle || f.featuredSubtitle,
        featuredDescription: suggestion.featuredDescription || f.featuredDescription,
        featuredCtaText: suggestion.featuredCtaText || f.featuredCtaText,
        aiSuggestedStyle: suggestion.aiSuggestedStyle || f.aiSuggestedStyle,
      }));
      setAiMessage("AI style suggestion applied — review before publishing.");
    } catch (err) {
      setError(err.message || "Could not generate featured style.");
    } finally {
      setAiLoading("");
    }
  }

  async function applyAiImagePrompt() {
    if (!editId || editId === "new") return;
    setAiLoading("prompt");
    setAiMessage("");
    setError("");
    try {
      const data = await apiFetch(`/api/admin/events/${editId}/ai/featured-image-prompt`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      const prompt = data.prompt || {};
      setAiMessage(prompt.prompt || "Image prompt generated.");
      setForm((f) => ({
        ...f,
        aiSuggestedStyle: {
          ...(f.aiSuggestedStyle || {}),
          imagePrompt: prompt,
        },
      }));
    } catch (err) {
      setError(err.message || "Could not generate image prompt.");
    } finally {
      setAiLoading("");
    }
  }

  function handleHeroUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField("heroImage", reader.result);
    reader.readAsDataURL(file);
  }

  async function handleDeleteEvent(eventId, title) {
    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis permanently removes the event and its ticket types. Events with sold tickets cannot be deleted.`
    );
    if (!confirmed) return;

    setDeletingId(eventId);
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      setMessage("Event deleted.");
      window.setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Could not delete event.");
    } finally {
      setDeletingId(null);
    }
  }

  async function saveEvent(status) {
    const { valid, errors } = validateEventForm(form);
    if (!valid) {
      setFieldErrors(errors);
      setError("Please fill in all required fields before saving.");
      return;
    }

    setSaving(true);
    setSavingAction(status);
    setError("");
    setMessage("");
    setFieldErrors({});
    try {
      const payload = toPayload(form, status);
      let saved;
      if (editId && editId !== "new") {
        const data = await apiFetch(`/api/admin/events/${editId}`, {
          method: "PUT",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
        saved = data.event;
      } else {
        const data = await apiFetch("/api/admin/events", {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
        saved = data.event;
        setSearchParams({ id: saved.id });
      }
      setForm(toFormEvent(saved));
      setMessage(status === "published" ? "Event published successfully." : "Event saved as draft.");
      window.setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.message || "Could not save event.");
    } finally {
      setSaving(false);
      setSavingAction("");
    }
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    saveEvent("published");
  }

  if (!editId) {
    const publishedCount = eventCounts?.published ?? events.filter((ev) => ev.status === "published").length;
    const draftCount = eventCounts?.draft ?? events.filter((ev) => ev.status === "draft").length;
    const totalCount = eventCounts?.total ?? events.length + ticketTailorEvents.length;
    const ttCount = eventCounts?.ticketTailor ?? ticketTailorEvents.length;

    function renderEventCard(ev, { readOnly = false } = {}) {
      const eventDate = ev.date ? new Date(ev.date) : null;
      const dayLabel = eventDate
        ? eventDate.toLocaleDateString("nl-NL", { day: "2-digit" })
        : "—";
      const monthLabel = eventDate
        ? eventDate.toLocaleDateString("nl-NL", { month: "short" })
        : "";

      return (
        <li key={ev.id} className={`admin-events__event-card${readOnly ? " admin-events__event-card--tt" : ""}`}>
          <div className="admin-events__event-card-body">
            <div className="admin-events__event-date-chip" aria-hidden>
              <span className="admin-events__event-date-day">{dayLabel}</span>
              <span className="admin-events__event-date-month">{monthLabel}</span>
            </div>
            <div className="admin-events__event-info">
              <div className="admin-events__event-title-row">
                <h2 className="admin-events__event-title">{ev.title}</h2>
                {renderEventBadges(ev, { readOnly })}
              </div>
              <div className="admin-events__event-meta-group">
                <p className="admin-events__event-meta">
                  <IconCalendar size={14} aria-hidden />
                  <span>
                    {eventDate
                      ? eventDate.toLocaleDateString("nl-NL", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Date TBD"}
                    {ev.startTime ? ` · ${ev.startTime}` : ""}
                  </span>
                </p>
                {ev.venueName ? (
                  <p className="admin-events__event-meta">
                    <IconMapPin size={14} aria-hidden />
                    <span>{ev.venueName}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <AdminEventCardActions
            ev={ev}
            readOnly={readOnly}
            deletingId={deletingId}
            onEdit={() => setSearchParams({ id: ev.id })}
            onDelete={() => handleDeleteEvent(ev.id, ev.title)}
            onPatchFeatured={(flags) => patchFeaturedFlag(ev.id, flags)}
          />
        </li>
      );
    }

    const searchNeedle = listSearch.trim().toLowerCase();
    const matchesSearch = (ev) => {
      if (!searchNeedle) return true;
      return (
        ev.title?.toLowerCase().includes(searchNeedle) ||
        ev.venueName?.toLowerCase().includes(searchNeedle) ||
        ev.category?.toLowerCase().includes(searchNeedle)
      );
    };

    const filteredPlatformEvents = events.filter((ev) => {
      if (!matchesSearch(ev)) return false;
      if (listFilter === "all") return true;
      if (listFilter === "published") return ev.status === "published";
      if (listFilter === "draft") return ev.status === "draft";
      if (listFilter === "featured") return ev.featured;
      return true;
    });

    const filteredTicketTailorEvents =
      listFilter === "published" || listFilter === "draft" || listFilter === "featured"
        ? []
        : ticketTailorEvents.filter(matchesSearch);

    const showPlatformSection = listFilter !== "tickettailor";
    const showTicketTailorSection = listFilter === "all" || listFilter === "tickettailor";

    return (
      <AdminLayout hideBottomNav>
        <div className="admin-events admin-events--list">
          <header className="admin-events__list-hero">
            <div className="admin-events__list-hero-copy">
              <h1 className="admin-events__title">Events</h1>
              <p className="admin-events__subtitle">Create and manage ticketed events.</p>
            </div>
            <button
              type="button"
              className="admin-events__new-btn"
              onClick={() => setSearchParams({ id: "new" })}
            >
              <IconPlus size={18} aria-hidden />
              <span>New Event</span>
            </button>
            <Link to="/admin/events/highlights" className="admin-events__outline-btn admin-events__highlights-link">
              <IconVideo size={18} aria-hidden />
              <span>Event Highlights</span>
            </Link>
          </header>

          {!loading && (events.length > 0 || ticketTailorEvents.length > 0) ? (
            <div className="admin-events__summary" aria-label="Event overview">
              <article className="admin-events__summary-card">
                <p className="admin-events__summary-value">{totalCount}</p>
                <p className="admin-events__summary-label">Total</p>
              </article>
              <article className="admin-events__summary-card admin-events__summary-card--published">
                <p className="admin-events__summary-value">{publishedCount}</p>
                <p className="admin-events__summary-label">Published</p>
              </article>
              <article className="admin-events__summary-card admin-events__summary-card--draft">
                <p className="admin-events__summary-value">{draftCount}</p>
                <p className="admin-events__summary-label">Platform drafts</p>
              </article>
              <article className="admin-events__summary-card admin-events__summary-card--tt">
                <p className="admin-events__summary-value">{ttCount}</p>
                <p className="admin-events__summary-label">TicketTailor</p>
              </article>
            </div>
          ) : null}

          <div className="admin-events__list-toolbar">
            <label className="admin-events__list-search">
              <IconSearch size={18} aria-hidden />
              <input
                type="search"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search events…"
                aria-label="Search events"
              />
            </label>
            <div className="admin-events__list-tabs" role="tablist" aria-label="Filter events">
              {[
                ["all", "All"],
                ["published", "Published"],
                ["featured", "Featured"],
                ["draft", "Drafts"],
                ["tickettailor", "TicketTailor"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={`admin-events__list-tab${listFilter === id ? " admin-events__list-tab--active" : ""}`}
                  aria-selected={listFilter === id}
                  onClick={() => setListFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <>
              <p className="admin-events__status" role="status">Loading events…</p>
              <AdminEventListSkeleton />
            </>
          ) : null}
          {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
          {message ? <p className="admin-events__save-message" role="status">{message}</p> : null}

          {ticketTailorMeta?.warning ? (
            <p className="admin-events__tt-warning" role="status">{ticketTailorMeta.warning}</p>
          ) : null}

          {showPlatformSection && filteredPlatformEvents.length > 0 ? (
            <>
              <h2 className="admin-events__section-title">Platform Events</h2>
              <ul className="admin-events__event-list">
                {filteredPlatformEvents.map((ev) => renderEventCard(ev))}
              </ul>
            </>
          ) : null}

          {showTicketTailorSection && filteredTicketTailorEvents.length > 0 ? (
            <>
              <h2 className="admin-events__section-title admin-events__section-title--tt">TicketTailor Events</h2>
              <ul className="admin-events__event-list">
                {filteredTicketTailorEvents.map((ev) => renderEventCard(ev, { readOnly: true }))}
              </ul>
            </>
          ) : null}

          {!loading &&
          showPlatformSection &&
          showTicketTailorSection &&
          filteredPlatformEvents.length === 0 &&
          filteredTicketTailorEvents.length === 0 &&
          (events.length > 0 || ticketTailorEvents.length > 0) ? (
            <div className="admin-events__empty admin-events__empty--filtered">
              <h2>No events found</h2>
              <p>Try a different search or filter.</p>
            </div>
          ) : null}

          {!loading && events.length === 0 && ticketTailorEvents.length === 0 ? (
            <div className="admin-events__empty">
              <span className="admin-events__empty-icon" aria-hidden>
                <IconCalendarEvent size={32} />
              </span>
              <h2>No events yet</h2>
              <p>Create your first ticketed event to start selling.</p>
              <button
                type="button"
                className="admin-events__save-btn admin-events__empty-cta"
                onClick={() => setSearchParams({ id: "new" })}
              >
                <IconPlus size={18} aria-hidden /> Create Event
              </button>
            </div>
          ) : null}

          {!loading && events.length > 0 ? (
            <button
              type="button"
              className="admin-events__fab"
              onClick={() => setSearchParams({ id: "new" })}
              aria-label="Create new event"
            >
              <IconPlus size={22} />
            </button>
          ) : null}
        </div>
      </AdminLayout>
    );
  }

  if (editId === "new") {
    // reset handled by useEffect when id is new - but form might still be empty from list view
  }

  return (
    <AdminLayout hideBottomNav>
      <div className="admin-events admin-events--form">
        <header className="admin-events__hero">
          <button type="button" className="admin-events__back" onClick={() => setSearchParams({})}>
            <IconArrowLeft size={18} /> Back
          </button>
          <h1 className="admin-events__title">{editId === "new" ? "Create Event" : "Edit Event"}</h1>
          <p className="admin-events__subtitle">Set up event details and ticket types</p>
        </header>

        {loading ? (
          <div className="admin-events__loading" role="status">
            <span className="admin-events__spinner" aria-hidden />
            Loading event…
          </div>
        ) : null}
        {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
        {message ? <p className="admin-events__save-message" role="status">{message}</p> : null}

        <form className="admin-events__form" onSubmit={handleFormSubmit} noValidate hidden={loading}>
          <section className="admin-events__card">
            <header className="admin-events__card-header admin-events__card-header--centered">
              <div className="admin-events__card-heading admin-events__card-heading--centered">
                <span className="admin-events__card-icon"><IconCalendarEvent size={20} /></span>
                <h2>Event Details</h2>
              </div>
            </header>
            <div className="admin-events__card-body">
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="event-title">
                  Event Title <span className="admin-events__required">*</span>
                </label>
                <input
                  id="event-title"
                  className={`admin-events__input${fieldErrors.title ? " admin-events__input--error" : ""}`}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? "event-title-error" : undefined}
                />
                {fieldErrors.title ? (
                  <p id="event-title-error" className="admin-events__field-error" role="alert">{fieldErrors.title}</p>
                ) : null}
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="event-desc">Description</label>
                <textarea
                  id="event-desc"
                  className="admin-events__textarea"
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
              <div className="admin-events__datetime-row admin-events__datetime-row--schedule">
                <PickerField
                  id="event-date"
                  label="Date"
                  type="date"
                  icon={IconCalendar}
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  required
                  error={fieldErrors.date}
                />
                <PickerField
                  id="start-time"
                  label="Start"
                  type="time"
                  icon={IconClock}
                  value={form.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  required
                  error={fieldErrors.startTime}
                />
                <PickerField
                  id="end-time"
                  label="End"
                  type="time"
                  icon={IconClock}
                  value={form.endTime}
                  onChange={(e) => updateField("endTime", e.target.value)}
                />
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="venue-name">
                  Venue Name <span className="admin-events__required">*</span>
                </label>
                <input
                  id="venue-name"
                  className={`admin-events__input${fieldErrors.venueName ? " admin-events__input--error" : ""}`}
                  value={form.venueName}
                  onChange={(e) => updateField("venueName", e.target.value)}
                  required
                  aria-invalid={Boolean(fieldErrors.venueName)}
                  aria-describedby={fieldErrors.venueName ? "venue-name-error" : undefined}
                />
                {fieldErrors.venueName ? (
                  <p id="venue-name-error" className="admin-events__field-error" role="alert">{fieldErrors.venueName}</p>
                ) : null}
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="venue-address">
                  Venue Address <span className="admin-events__required">*</span>
                </label>
                <input
                  id="venue-address"
                  className={`admin-events__input${fieldErrors.venueAddress ? " admin-events__input--error" : ""}`}
                  value={form.venueAddress}
                  onChange={(e) => updateField("venueAddress", e.target.value)}
                  required
                  aria-invalid={Boolean(fieldErrors.venueAddress)}
                  aria-describedby={fieldErrors.venueAddress ? "venue-address-error" : undefined}
                />
                {fieldErrors.venueAddress ? (
                  <p id="venue-address-error" className="admin-events__field-error" role="alert">{fieldErrors.venueAddress}</p>
                ) : null}
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label">Hero Image</label>
                <label className="admin-events__upload-btn">
                  <IconUpload size={16} /> Upload image
                  <input type="file" accept="image/*" hidden onChange={handleHeroUpload} />
                </label>
                {form.heroImage ? <img src={form.heroImage} alt="" className="admin-events__hero-preview" /> : null}
              </div>
              <div className="admin-events__field-row">
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="booking-fee">Booking Fee (€)</label>
                  <input
                    id="booking-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    className="admin-events__input"
                    value={form.bookingFee}
                    onChange={(e) => updateField("bookingFee", e.target.value)}
                  />
                </div>
                <label className="admin-events__toggle admin-events__toggle--inline">
                  <input type="checkbox" checked={form.salesEnabled} onChange={(e) => updateField("salesEnabled", e.target.checked)} />
                  <span className="admin-events__toggle-track" />
                  <span>Ticket sales enabled</span>
                </label>
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="event-category">Category</label>
                <input
                  id="event-category"
                  className="admin-events__input"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  placeholder="Experience"
                />
              </div>
              <div className="admin-events__dashboard-settings">
                <h3 className="admin-events__settings-title">Dashboard &amp; Membership</h3>
                <label className="admin-events__toggle">
                  <input type="checkbox" checked={form.showOnDashboard} onChange={(e) => updateField("showOnDashboard", e.target.checked)} />
                  <span className="admin-events__toggle-track" />
                  <span>Show on Dashboard</span>
                </label>
                <label className="admin-events__toggle">
                  <input type="checkbox" checked={form.membershipIncluded} onChange={(e) => updateField("membershipIncluded", e.target.checked)} />
                  <span className="admin-events__toggle-track" />
                  <span>Membership Included (Premium free entry)</span>
                </label>
                <label className="admin-events__toggle">
                  <input type="checkbox" checked={form.membershipDiscountEligible} onChange={(e) => updateField("membershipDiscountEligible", e.target.checked)} />
                  <span className="admin-events__toggle-track" />
                  <span>Membership Discount Eligible</span>
                </label>
              </div>
              <div className="admin-events__dashboard-settings">
                <h3 className="admin-events__settings-title">Ticket Checkout Settings</h3>
                {[
                  ["enableMemberDiscount", "Enable Member Discount"],
                  ["enableMembershipUpsell", "Enable Membership Upsell"],
                  ["allowInstantMembershipBenefit", "Allow Instant Membership Benefit"],
                  ["allowMembershipTicketBundle", "Allow Membership + Ticket Bundle"],
                  ["allowDiscountStacking", "Allow Discount Stacking"],
                  ["showPriceComparisonPreview", "Show Price Comparison Preview"],
                ].map(([key, label]) => (
                  <label key={key} className="admin-events__toggle">
                    <input
                      type="checkbox"
                      checked={form.checkoutSettings?.[key] !== false}
                      onChange={(e) =>
                        updateField("checkoutSettings", {
                          ...form.checkoutSettings,
                          [key]: e.target.checked,
                        })
                      }
                    />
                    <span className="admin-events__toggle-track" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-events__card">
            <header className="admin-events__card-header admin-events__card-header--centered">
              <div className="admin-events__card-heading admin-events__card-heading--centered">
                <span className="admin-events__card-icon"><IconStar size={20} /></span>
                <h2>Home &amp; Events Page Featured Display</h2>
              </div>
              <div className="admin-events__featured-ai-actions">
                <button
                  type="button"
                  className="admin-events__outline-btn"
                  disabled={aiLoading || editId === "new"}
                  onClick={applyAiFeaturedStyle}
                >
                  <IconSparkles size={16} aria-hidden />
                  {aiLoading === "style" ? "Generating…" : "Generate Featured Display Style"}
                </button>
                <button
                  type="button"
                  className="admin-events__outline-btn"
                  disabled={aiLoading || editId === "new"}
                  onClick={applyAiImagePrompt}
                >
                  <IconSparkles size={16} aria-hidden />
                  {aiLoading === "prompt" ? "Generating…" : "Generate Image Prompt"}
                </button>
              </div>
            </header>
            <div className="admin-events__card-body">
              {aiMessage ? <p className="admin-events__ai-message" role="status">{aiMessage}</p> : null}
              <div className="admin-events__featured-toggles">
                <label className="admin-events__toggle">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((f) => ({
                        ...f,
                        featured: checked,
                        ...(checked && !f.showOnHomePage && !f.showOnEventsPage
                          ? { showOnHomePage: true, showOnEventsPage: true }
                          : {}),
                      }));
                    }}
                  />
                  <span className="admin-events__toggle-track" />
                  <span>Show this event as featured</span>
                </label>
                <label className="admin-events__toggle">
                  <input
                    type="checkbox"
                    checked={form.showOnHomePage}
                    onChange={(e) => updateField("showOnHomePage", e.target.checked)}
                  />
                  <span className="admin-events__toggle-track" />
                  <span>Show on Home Page</span>
                </label>
                <label className="admin-events__toggle">
                  <input
                    type="checkbox"
                    checked={form.showOnEventsPage}
                    onChange={(e) => updateField("showOnEventsPage", e.target.checked)}
                  />
                  <span className="admin-events__toggle-track" />
                  <span>Show on Events Page</span>
                </label>
              </div>
              <div className="admin-events__field-row">
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="featured-priority">Featured Priority</label>
                  <input
                    id="featured-priority"
                    type="number"
                    min="0"
                    className="admin-events__input"
                    value={form.featuredPriority}
                    onChange={(e) => updateField("featuredPriority", e.target.value)}
                  />
                </div>
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="featured-display-mode">Display Mode</label>
                  <select
                    id="featured-display-mode"
                    className="admin-events__select"
                    value={form.featuredDisplayMode}
                    onChange={(e) => updateField("featuredDisplayMode", e.target.value)}
                  >
                    {["Auto", "Light", "Dark", "Cinematic", "Elegant", "Women-focused", "Cultural", "Concert/DJ", "Family/Community"].map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-events__field-row">
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="featured-alignment">Text Alignment</label>
                  <select
                    id="featured-alignment"
                    className="admin-events__select"
                    value={form.featuredTextAlignment}
                    onChange={(e) => updateField("featuredTextAlignment", e.target.value)}
                  >
                    <option value="Left">Left</option>
                    <option value="Center">Center</option>
                    <option value="Right">Right</option>
                  </select>
                </div>
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="featured-overlay">Overlay Strength</label>
                  <select
                    id="featured-overlay"
                    className="admin-events__select"
                    value={form.featuredOverlayStrength}
                    onChange={(e) => updateField("featuredOverlayStrength", e.target.value)}
                  >
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Strong">Strong</option>
                  </select>
                </div>
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="featured-focus">Image Focus</label>
                  <select
                    id="featured-focus"
                    className="admin-events__select"
                    value={form.featuredImageFocusPosition}
                    onChange={(e) => updateField("featuredImageFocusPosition", e.target.value)}
                  >
                    {["Center", "Top", "Bottom", "Left", "Right"].map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="featured-title">Featured Title</label>
                <input
                  id="featured-title"
                  className="admin-events__input"
                  value={form.featuredTitle}
                  onChange={(e) => updateField("featuredTitle", e.target.value)}
                  placeholder={form.title || "Defaults to event title"}
                />
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="featured-subtitle">Featured Subtitle</label>
                <input
                  id="featured-subtitle"
                  className="admin-events__input"
                  value={form.featuredSubtitle}
                  onChange={(e) => updateField("featuredSubtitle", e.target.value)}
                />
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="featured-description">Featured Description</label>
                <textarea
                  id="featured-description"
                  className="admin-events__textarea"
                  rows={3}
                  value={form.featuredDescription}
                  onChange={(e) => updateField("featuredDescription", e.target.value)}
                  placeholder={form.description || "Defaults to event description"}
                />
              </div>
              <div className="admin-events__field-row">
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="featured-badge">Badge Text</label>
                  <input
                    id="featured-badge"
                    className="admin-events__input"
                    value={form.featuredBadgeText}
                    onChange={(e) => updateField("featuredBadgeText", e.target.value)}
                  />
                </div>
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="featured-cta">CTA Text</label>
                  <input
                    id="featured-cta"
                    className="admin-events__input"
                    value={form.featuredCtaText}
                    onChange={(e) => updateField("featuredCtaText", e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="featured-image-alt">Image Alt Text</label>
                <input
                  id="featured-image-alt"
                  className="admin-events__input"
                  value={form.featuredImageAlt}
                  onChange={(e) => updateField("featuredImageAlt", e.target.value)}
                />
              </div>
              <div className="admin-events__field-row">
                <div className="admin-events__field">
                  <label className="admin-events__label">Featured Hero Image</label>
                  <label className="admin-events__upload-btn">
                    <IconUpload size={16} /> Upload hero (16:9, min 1280×720)
                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => handleFeaturedImageUpload("featuredHeroImageUrl", e)} />
                  </label>
                  {form.featuredHeroImageUrl ? (
                    <img src={form.featuredHeroImageUrl} alt="" className="admin-events__hero-preview" />
                  ) : null}
                </div>
                <div className="admin-events__field">
                  <label className="admin-events__label">Featured Mobile Image</label>
                  <label className="admin-events__upload-btn">
                    <IconUpload size={16} /> Upload mobile (optional)
                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => handleFeaturedImageUpload("featuredMobileImageUrl", e)} />
                  </label>
                  {form.featuredMobileImageUrl ? (
                    <img src={form.featuredMobileImageUrl} alt="" className="admin-events__hero-preview" />
                  ) : null}
                </div>
              </div>
              {form.aiSuggestedStyle?.imagePrompt?.prompt ? (
                <div className="admin-events__ai-prompt-box">
                  <div className="admin-events__ai-prompt-header">
                    <p className="admin-events__label">Generated Image Prompt (review only)</p>
                    <button
                      type="button"
                      className="admin-events__outline-btn admin-events__outline-btn--compact"
                      onClick={() => {
                        navigator.clipboard?.writeText(form.aiSuggestedStyle.imagePrompt.prompt);
                        setAiMessage("Image prompt copied to clipboard.");
                      }}
                    >
                      <IconCopy size={14} aria-hidden /> Copy
                    </button>
                  </div>
                  <p className="admin-events__ai-prompt-text">{form.aiSuggestedStyle.imagePrompt.prompt}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section id="post-event-highlights" className="admin-events__card">
            <header className="admin-events__card-header admin-events__card-header--centered">
              <div className="admin-events__card-heading admin-events__card-heading--centered">
                <span className="admin-events__card-icon"><IconVideo size={20} /></span>
                <h2>Post-Event Highlights</h2>
              </div>
            </header>
            <div className="admin-events__card-body">
              <p className="admin-events__field-hint">
                Completed published events appear in Memorable Moments on the Events page.
              </p>
              <div className="admin-events__featured-toggles">
                <label className="admin-events__toggle">
                  <input
                    type="checkbox"
                    checked={form.showInMemorableMoments}
                    onChange={(e) => updateField("showInMemorableMoments", e.target.checked)}
                  />
                  <span className="admin-events__toggle-track" />
                  <span>Show in Memorable Moments</span>
                </label>
                <label className="admin-events__toggle">
                  <input
                    type="checkbox"
                    checked={form.featuredHighlight}
                    onChange={(e) => updateField("featuredHighlight", e.target.checked)}
                  />
                  <span className="admin-events__toggle-track" />
                  <span>Featured Highlight</span>
                </label>
              </div>
              <div className="admin-events__field-row">
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="highlight-status">Highlight Status</label>
                  <select
                    id="highlight-status"
                    className="admin-events__select"
                    value={form.highlightStatus}
                    onChange={(e) => updateField("highlightStatus", e.target.value)}
                  >
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Video Available">Video Available</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="highlight-priority">Highlight Priority</label>
                  <input
                    id="highlight-priority"
                    type="number"
                    min="0"
                    className="admin-events__input"
                    value={form.highlightPriority}
                    onChange={(e) => updateField("highlightPriority", e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="highlight-video-type">Highlight Video Type</label>
                <select
                  id="highlight-video-type"
                  className="admin-events__select"
                  value={form.highlightVideoType || "youtube_short"}
                  onChange={(e) => updateField("highlightVideoType", e.target.value)}
                >
                  <option value="youtube_short">YouTube Short</option>
                  <option value="youtube_video">YouTube Video</option>
                  <option value="youtube_playlist">YouTube Playlist</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="internal">Internal Video</option>
                </select>
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="youtube-highlight-url">Highlight URL</label>
                <input
                  id="youtube-highlight-url"
                  className="admin-events__input"
                  value={form.highlightVideoUrl || form.youtubeHighlightUrl}
                  onChange={(e) => {
                    updateField("highlightVideoUrl", e.target.value);
                    updateField("youtubeHighlightUrl", e.target.value);
                  }}
                  onBlur={(e) => {
                    if (String(form.highlightVideoType || "").startsWith("youtube")) {
                      previewYoutubeUrl(e.target.value);
                    }
                  }}
                  placeholder="https://youtube.com/shorts/... or Vimeo/Internal URL"
                />
                {youtubePreviewLoading ? (
                  <p className="admin-events__field-hint" role="status">Validating YouTube link…</p>
                ) : null}
                {String(form.highlightVideoType || "").startsWith("youtube") && youtubePreview?.youtubeThumbnailUrl ? (
                  <img
                    src={youtubePreview.youtubeThumbnailUrl}
                    alt="YouTube preview"
                    className="admin-events__hero-preview"
                  />
                ) : null}
                {form.youtubeVideoId && String(form.highlightVideoType || "").startsWith("youtube") ? (
                  <p className="admin-events__field-hint">Video ID: {form.youtubeVideoId}</p>
                ) : null}
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="highlight-title">Highlight Title</label>
                <input
                  id="highlight-title"
                  className="admin-events__input"
                  value={form.highlightTitle}
                  onChange={(e) => updateField("highlightTitle", e.target.value)}
                  placeholder={form.title || "Defaults to event title"}
                />
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="highlight-subtitle">Highlight Subtitle</label>
                <input
                  id="highlight-subtitle"
                  className="admin-events__input"
                  value={form.highlightSubtitle}
                  onChange={(e) => updateField("highlightSubtitle", e.target.value)}
                />
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="highlight-description">Highlight Description</label>
                <textarea
                  id="highlight-description"
                  className="admin-events__textarea"
                  rows={3}
                  value={form.highlightDescription}
                  onChange={(e) => updateField("highlightDescription", e.target.value)}
                  placeholder={form.description || "Defaults to event description"}
                />
              </div>
              <div className="admin-events__field">
                <label className="admin-events__label" htmlFor="impact-text">Impact Text</label>
                <textarea
                  id="impact-text"
                  className="admin-events__textarea"
                  rows={2}
                  value={form.impactText}
                  onChange={(e) => updateField("impactText", e.target.value)}
                  placeholder="An unforgettable V.O.I.C.E. NL experience filled with culture, connection and shared memories."
                />
              </div>
              <div className="admin-events__field-row">
                <div className="admin-events__field">
                  <label className="admin-events__label">Highlight Thumbnail</label>
                  <label className="admin-events__upload-btn">
                    <IconUpload size={16} /> Upload thumbnail
                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleHighlightThumbnailUpload} />
                  </label>
                  {form.highlightThumbnailImageUrl ? (
                    <img src={form.highlightThumbnailImageUrl} alt="" className="admin-events__hero-preview" />
                  ) : null}
                </div>
                <div className="admin-events__field">
                  <label className="admin-events__label" htmlFor="gallery-url">Gallery URL (optional)</label>
                  <input
                    id="gallery-url"
                    className="admin-events__input"
                    value={form.galleryUrl}
                    onChange={(e) => updateField("galleryUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </section>

          {editId ? (
            <section className="admin-events__card">
              <header className="admin-events__card-header admin-events__card-header--centered">
                <div className="admin-events__card-heading admin-events__card-heading--centered">
                  <span className="admin-events__card-icon"><IconMap size={20} /></span>
                  <h2>Seating &amp; Seat Map</h2>
                </div>
              </header>
              <div className="admin-events__card-body">
                <p className="admin-events__hint">
                  Upload a venue seat map, place seats, and enable reserved seating for ticket buyers.
                </p>
                <Link to={`/admin/events/${editId}/seat-map`} className="admin-events__outline-btn">
                  <IconMap size={16} /> Open seat map editor
                </Link>
              </div>
            </section>
          ) : (
            <section className="admin-events__card">
              <header className="admin-events__card-header">
                <h2>Seating &amp; Seat Map</h2>
              </header>
              <div className="admin-events__card-body">
                <p className="admin-events__hint">Save the event first, then configure reserved seating and seat maps.</p>
              </div>
            </section>
          )}

          {editId ? (
            <section className="admin-events__card">
              <header className="admin-events__card-header admin-events__card-header--centered">
                <div className="admin-events__card-heading admin-events__card-heading--centered">
                  <span className="admin-events__card-icon"><IconPackage size={20} /></span>
                  <h2>Event Operations</h2>
                </div>
              </header>
              <div className="admin-events__card-body">
                <p className="admin-events__hint">
                  Manage inventory, technical rider, stage plan, documents, checklists and vendors for this event.
                </p>
                <Link to={`/admin/events/${editId}/operations`} className="admin-events__outline-btn">
                  <IconPackage size={16} /> Open event operations
                </Link>
              </div>
            </section>
          ) : null}

          <section className="admin-events__card">
            <header className="admin-events__card-header admin-events__card-header--centered admin-events__card-header--tickets">
              <div className="admin-events__card-heading admin-events__card-heading--centered">
                <span className="admin-events__card-icon"><IconTicket size={20} /></span>
                <h2>Ticket Types</h2>
              </div>
              <button type="button" className="admin-events__outline-btn admin-events__card-header-action" onClick={addTicketType}>
                <IconPlus size={16} /> Add Type
              </button>
            </header>
            <div className="admin-events__card-body">
              <ul className="admin-events__ticket-editor-list">
                {form.ticketTypes.map((tt, i) => (
                  <li key={tt.id || i} className="admin-events__ticket-editor">
                    <div className="admin-events__ticket-editor-grid">
                      <input className="admin-events__input" placeholder="Name" value={tt.name} onChange={(e) => updateTicket(i, "name", e.target.value)} />
                      <input className="admin-events__input" placeholder="Price €" type="number" min="0" step="0.01" value={tt.price} onChange={(e) => updateTicket(i, "price", e.target.value)} />
                      <input className="admin-events__input" placeholder="Capacity" type="number" min="0" value={tt.capacity} onChange={(e) => updateTicket(i, "capacity", e.target.value)} />
                      <input className="admin-events__input" placeholder="Max/order" type="number" min="1" value={tt.maxPerOrder} onChange={(e) => updateTicket(i, "maxPerOrder", e.target.value)} />
                      <select className="admin-events__select" value={tt.status} onChange={(e) => updateTicket(i, "status", e.target.value)}>
                        <option value="active">Active</option>
                        <option value="sold_out">Sold Out</option>
                        <option value="hidden">Hidden</option>
                      </select>
                      <button type="button" className="admin-events__icon-danger" onClick={() => removeTicketType(i)} aria-label="Remove">
                        <IconTrash size={16} />
                      </button>
                    </div>
                    <input className="admin-events__input" placeholder="Short description" value={tt.description} onChange={(e) => updateTicket(i, "description", e.target.value)} />
                    <div className="admin-events__datetime-row">
                      <PickerField
                        id={`sale-start-${i}`}
                        label="Sale start"
                        type="datetime-local"
                        icon={IconCalendar}
                        value={tt.saleStartDate}
                        onChange={(e) => updateTicket(i, "saleStartDate", e.target.value)}
                      />
                      <PickerField
                        id={`sale-end-${i}`}
                        label="Sale end"
                        type="datetime-local"
                        icon={IconCalendar}
                        value={tt.saleEndDate}
                        onChange={(e) => updateTicket(i, "saleEndDate", e.target.value)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <footer className="admin-events__footer admin-events__footer--actions">
            <button
              type="button"
              className="admin-events__outline-btn"
              disabled={saving || loading}
              onClick={() => saveEvent("draft")}
            >
              <IconDeviceFloppy size={18} />
              {saving && savingAction === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              type="submit"
              className="admin-events__save-btn"
              disabled={saving || loading}
            >
              <IconWorldUpload size={18} />
              {saving && savingAction === "published" ? "Publishing…" : "Publish Event"}
            </button>
          </footer>
        </form>
      </div>
    </AdminLayout>
  );
}
