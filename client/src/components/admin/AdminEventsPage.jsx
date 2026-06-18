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
  IconPencil,
  IconPlus,
  IconTicket,
  IconTrash,
  IconUpload,
  IconWorldUpload,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-events-page.css";

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
                <span className={`admin-events__status-badge admin-events__status-badge--${ev.status}`}>
                  {ev.status}
                </span>
                {readOnly ? (
                  <span className="admin-events__source-badge">TicketTailor</span>
                ) : null}
              </div>
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
          <div className="admin-events__event-card-actions">
            {readOnly ? (
              ev.bookingUrl ? (
                <a
                  href={ev.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-events__action-btn admin-events__action-btn--tt"
                >
                  <IconExternalLink size={16} aria-hidden />
                  <span>View on TicketTailor</span>
                </a>
              ) : (
                <span className="admin-events__tt-note">Synced from TicketTailor</span>
              )
            ) : (
              <>
                <button
                  type="button"
                  className="admin-events__action-btn admin-events__action-btn--primary"
                  onClick={() => setSearchParams({ id: ev.id })}
                >
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
                  onClick={() => handleDeleteEvent(ev.id, ev.title)}
                  aria-label={`Delete ${ev.title}`}
                >
                  <IconTrash size={16} aria-hidden />
                  <span>{deletingId === ev.id ? "Deleting…" : "Delete"}</span>
                </button>
              </>
            )}
          </div>
        </li>
      );
    }

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

          {loading ? (
            <div className="admin-events__loading" role="status">
              <span className="admin-events__spinner" aria-hidden />
              Loading events…
            </div>
          ) : null}
          {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
          {message ? <p className="admin-events__save-message" role="status">{message}</p> : null}

          {ticketTailorMeta?.warning ? (
            <p className="admin-events__tt-warning" role="status">{ticketTailorMeta.warning}</p>
          ) : null}

          {events.length > 0 ? (
            <>
              <h2 className="admin-events__section-title">Platform Events</h2>
              <ul className="admin-events__event-list">
                {events.map((ev) => renderEventCard(ev))}
              </ul>
            </>
          ) : null}

          {ticketTailorEvents.length > 0 ? (
            <>
              <h2 className="admin-events__section-title admin-events__section-title--tt">TicketTailor Events</h2>
              <ul className="admin-events__event-list">
                {ticketTailorEvents.map((ev) => renderEventCard(ev, { readOnly: true }))}
              </ul>
            </>
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
            </div>
          </section>

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
