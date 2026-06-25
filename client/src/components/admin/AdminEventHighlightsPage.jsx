import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconExternalLink,
  IconPlayerPlay,
  IconSearch,
  IconUpload,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-events-page.css";
import "../../styles/admin-event-highlights-page.css";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "Video Available", label: "Video Available" },
  { id: "Coming Soon", label: "Coming Soon" },
  { id: "hidden", label: "Hidden" },
  { id: "featured", label: "Featured" },
];

const EMPTY_EDIT_FORM = {
  showInMemorableMoments: true,
  featuredHighlight: false,
  highlightStatus: "Coming Soon",
  highlightPriority: 100,
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
};

function toEditForm(adminFields = {}) {
  return { ...EMPTY_EDIT_FORM, ...adminFields };
}

export default function AdminEventHighlightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");
  const [preview, setPreview] = useState(null);
  const [savingId, setSavingId] = useState("");
  const [analytics, setAnalytics] = useState(null);

  const [expandedId, setExpandedId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [youtubePreview, setYoutubePreview] = useState(null);
  const [youtubePreviewLoading, setYoutubePreviewLoading] = useState(false);
  const autoExpandedRef = useRef(false);
  const cardRefs = useRef({});

  const loadHighlights = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (yearFilter) params.set("year", yearFilter);
      const query = params.toString();
      const data = await apiFetch(`/api/admin/events/highlights${query ? `?${query}` : ""}`, {
        headers: adminAuthHeaders(),
      });
      setHighlights(data.highlights || []);
      const analyticsData = await apiFetch("/api/admin/events/highlights/analytics", {
        headers: adminAuthHeaders(),
      });
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || "Could not load event highlights.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, yearFilter]);

  useEffect(() => {
    const timer = window.setTimeout(loadHighlights, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadHighlights, search]);

  const years = useMemo(() => {
    const set = new Set(
      highlights
        .map((item) => (item.date ? new Date(item.date).getFullYear() : null))
        .filter(Boolean)
    );
    return [...set].sort((a, b) => b - a);
  }, [highlights]);

  function startEdit(item) {
    setExpandedId(item.eventId);
    setEditForm(toEditForm(item.adminFields));
    setYoutubePreview(null);
  }

  function cancelEdit() {
    setExpandedId("");
    setYoutubePreview(null);
  }

  function updateEditField(key, value) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  // Deep link from the Events page ("Highlights" quick action) — auto-open
  // the matching card once the list has loaded.
  useEffect(() => {
    if (autoExpandedRef.current || loading || !highlights.length) return;
    const targetId = searchParams.get("eventId");
    if (!targetId) return;
    const match = highlights.find((item) => item.eventId === targetId);
    if (match) {
      startEdit(match);
      window.setTimeout(() => {
        cardRefs.current[targetId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
    autoExpandedRef.current = true;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("eventId");
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, highlights]);

  async function patchHighlight(eventId, payload) {
    setSavingId(eventId);
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/admin/events/${eventId}/highlight`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(payload),
      });
      setMessage("Highlight updated.");
      await loadHighlights();
      window.setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Could not update highlight.");
    } finally {
      setSavingId("");
    }
  }

  async function saveEdit(eventId) {
    await patchHighlight(eventId, editForm);
    setExpandedId("");
  }

  async function previewYoutubeUrl(eventId, url) {
    if (!url?.trim()) {
      setYoutubePreview(null);
      return;
    }
    setYoutubePreviewLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/admin/events/${eventId}/highlight/preview-youtube`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ url }),
      });
      setYoutubePreview(data.preview);
      updateEditField("youtubeVideoId", data.preview.youtubeVideoId);
    } catch (err) {
      setYoutubePreview(null);
      setError(err.message || "Please enter a valid YouTube video link.");
    } finally {
      setYoutubePreviewLoading(false);
    }
  }

  async function handleThumbnailUpload(eventId, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      updateEditField("highlightThumbnailImageUrl", reader.result);
      try {
        await apiFetch(`/api/admin/events/${eventId}/highlight/upload-thumbnail`, {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify({ highlightThumbnailImageUrl: reader.result }),
        });
      } catch (err) {
        setError(err.message || "Could not upload thumbnail.");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <AdminLayout hideBottomNav>
      <div className="admin-highlights">
        <header className="admin-highlights__hero">
          <Link to="/admin/events" className="admin-highlights__back">
            <IconArrowLeft size={18} aria-hidden /> Back to Events
          </Link>
          <h1 className="admin-highlights__title">Post-Event Highlights</h1>
          <p className="admin-highlights__subtitle">
            Manage the videos, titles, and copy shown in the "Memorable Moments, Lasting Impact" section on the Events page.
          </p>
        </header>

        <div className="admin-highlights__toolbar">
          <label className="admin-highlights__search">
            <IconSearch size={18} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event name, location, category…"
            />
          </label>
          <div className="admin-highlights__filters" role="tablist" aria-label="Highlight filters">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                className={`admin-highlights__filter${statusFilter === filter.id ? " admin-highlights__filter--active" : ""}`}
                aria-selected={statusFilter === filter.id}
                onClick={() => setStatusFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <select
            className="admin-highlights__year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            aria-label="Filter by year"
          >
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {loading ? <p className="admin-highlights__status" role="status">Loading highlights…</p> : null}
        {analytics?.totals ? (
          <div className="admin-highlights__toolbar">
            <span>Total Views: {analytics.totals.highlightViews || 0}</span>
            <span>Modal Opens: {analytics.totals.modalOpens || 0}</span>
            <span>Video Plays: {analytics.totals.videoPlays || 0}</span>
            <span>Completion Rate: {analytics.totals.completionRate || 0}%</span>
          </div>
        ) : null}
        {error ? <p className="admin-highlights__error" role="alert">{error}</p> : null}
        {message ? <p className="admin-highlights__message" role="status">{message}</p> : null}

        {!loading && highlights.length === 0 ? (
          <p className="admin-highlights__empty">No completed events match your filters.</p>
        ) : null}

        <ul className="admin-highlights__list">
          {highlights.map((item) => {
            const isExpanded = expandedId === item.eventId;
            return (
              <li
                key={item.eventId}
                ref={(node) => { cardRefs.current[item.eventId] = node; }}
                className="admin-highlights__card-wrap"
              >
                <div className="admin-highlights__card">
                  <div className="admin-highlights__card-media">
                    {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : null}
                  </div>
                  <div className="admin-highlights__card-body">
                    <div className="admin-highlights__card-top">
                      <h2>{item.title}</h2>
                      <span className={`admin-highlights__badge admin-highlights__badge--${item.highlightStatus === "Video Available" ? "video" : item.highlightStatus === "Hidden" ? "hidden" : "soon"}`}>
                        {item.highlightStatus}
                      </span>
                      {item.featuredHighlight ? (
                        <span className="admin-highlights__badge admin-highlights__badge--featured">Featured</span>
                      ) : null}
                    </div>
                    <p className="admin-highlights__meta">
                      {item.formattedDate} · {item.location} · {item.category}
                    </p>
                    <p className="admin-highlights__youtube">
                      {item.youtubeUrl || "No YouTube link yet"}
                    </p>
                  </div>
                  <div className="admin-highlights__actions">
                    <button
                      type="button"
                      className="admin-highlights__action"
                      disabled={savingId === item.eventId}
                      onClick={() => (isExpanded ? cancelEdit() : startEdit(item))}
                    >
                      <IconEdit size={16} aria-hidden />
                      {isExpanded ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      className="admin-highlights__action"
                      disabled={savingId === item.eventId || !item.youtubeVideoId}
                      onClick={() => setPreview(item)}
                    >
                      <IconPlayerPlay size={16} aria-hidden />
                      Preview
                    </button>
                    <button
                      type="button"
                      className="admin-highlights__action"
                      disabled={savingId === item.eventId}
                      onClick={() =>
                        patchHighlight(item.eventId, {
                          highlightStatus: item.highlightStatus === "Hidden" ? "Coming Soon" : "Hidden",
                          showInMemorableMoments: item.highlightStatus === "Hidden",
                        })
                      }
                    >
                      {item.highlightStatus === "Hidden" ? <IconEye size={16} aria-hidden /> : <IconEyeOff size={16} aria-hidden />}
                      {item.highlightStatus === "Hidden" ? "Show" : "Hide"}
                    </button>
                    <button
                      type="button"
                      className="admin-highlights__action"
                      disabled={savingId === item.eventId}
                      onClick={() =>
                        patchHighlight(item.eventId, {
                          highlightStatus: item.youtubeVideoId ? "Video Available" : "Coming Soon",
                        })
                      }
                    >
                      Mark {item.youtubeVideoId ? "Video Available" : "Coming Soon"}
                    </button>
                    {item.youtubeUrl ? (
                      <a
                        href={item.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-highlights__action"
                      >
                        <IconExternalLink size={16} aria-hidden />
                        YouTube
                      </a>
                    ) : null}
                  </div>
                </div>

                {isExpanded ? (
                  <div className="admin-highlights__editor">
                    <div className="admin-events__featured-toggles">
                      <label className="admin-events__toggle">
                        <input
                          type="checkbox"
                          checked={editForm.showInMemorableMoments}
                          onChange={(e) => updateEditField("showInMemorableMoments", e.target.checked)}
                        />
                        <span className="admin-events__toggle-track" />
                        <span>Show in Memorable Moments</span>
                      </label>
                      <label className="admin-events__toggle">
                        <input
                          type="checkbox"
                          checked={editForm.featuredHighlight}
                          onChange={(e) => updateEditField("featuredHighlight", e.target.checked)}
                        />
                        <span className="admin-events__toggle-track" />
                        <span>Featured Highlight</span>
                      </label>
                    </div>
                    <div className="admin-events__field-row">
                      <div className="admin-events__field">
                        <label className="admin-events__label" htmlFor={`highlight-status-${item.eventId}`}>Highlight Status</label>
                        <select
                          id={`highlight-status-${item.eventId}`}
                          className="admin-events__select"
                          value={editForm.highlightStatus}
                          onChange={(e) => updateEditField("highlightStatus", e.target.value)}
                        >
                          <option value="Coming Soon">Coming Soon</option>
                          <option value="Video Available">Video Available</option>
                          <option value="Hidden">Hidden</option>
                        </select>
                      </div>
                      <div className="admin-events__field">
                        <label className="admin-events__label" htmlFor={`highlight-priority-${item.eventId}`}>Highlight Priority</label>
                        <input
                          id={`highlight-priority-${item.eventId}`}
                          type="number"
                          min="0"
                          className="admin-events__input"
                          value={editForm.highlightPriority}
                          onChange={(e) => updateEditField("highlightPriority", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="admin-events__field">
                      <label className="admin-events__label" htmlFor={`highlight-video-type-${item.eventId}`}>Highlight Video Type</label>
                      <select
                        id={`highlight-video-type-${item.eventId}`}
                        className="admin-events__select"
                        value={editForm.highlightVideoType || "youtube_short"}
                        onChange={(e) => updateEditField("highlightVideoType", e.target.value)}
                      >
                        <option value="youtube_short">YouTube Short</option>
                        <option value="youtube_video">YouTube Video</option>
                        <option value="youtube_playlist">YouTube Playlist</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="internal">Internal Video</option>
                      </select>
                    </div>
                    <div className="admin-events__field">
                      <label className="admin-events__label" htmlFor={`highlight-url-${item.eventId}`}>Highlight URL</label>
                      <input
                        id={`highlight-url-${item.eventId}`}
                        className="admin-events__input"
                        value={editForm.highlightVideoUrl || editForm.youtubeHighlightUrl}
                        onChange={(e) => {
                          updateEditField("highlightVideoUrl", e.target.value);
                          updateEditField("youtubeHighlightUrl", e.target.value);
                        }}
                        onBlur={(e) => {
                          if (String(editForm.highlightVideoType || "").startsWith("youtube")) {
                            previewYoutubeUrl(item.eventId, e.target.value);
                          }
                        }}
                        placeholder="https://youtube.com/shorts/... or Vimeo/Internal URL"
                      />
                      {youtubePreviewLoading ? (
                        <p className="admin-events__field-hint" role="status">Validating YouTube link…</p>
                      ) : null}
                      {String(editForm.highlightVideoType || "").startsWith("youtube") && youtubePreview?.youtubeThumbnailUrl ? (
                        <img
                          src={youtubePreview.youtubeThumbnailUrl}
                          alt="YouTube preview"
                          className="admin-events__hero-preview"
                        />
                      ) : null}
                      {editForm.youtubeVideoId && String(editForm.highlightVideoType || "").startsWith("youtube") ? (
                        <p className="admin-events__field-hint">Video ID: {editForm.youtubeVideoId}</p>
                      ) : null}
                    </div>
                    <div className="admin-events__field">
                      <label className="admin-events__label" htmlFor={`highlight-title-${item.eventId}`}>Highlight Title</label>
                      <input
                        id={`highlight-title-${item.eventId}`}
                        className="admin-events__input"
                        value={editForm.highlightTitle}
                        onChange={(e) => updateEditField("highlightTitle", e.target.value)}
                        placeholder={item.title || "Defaults to event title"}
                      />
                    </div>
                    <div className="admin-events__field">
                      <label className="admin-events__label" htmlFor={`highlight-subtitle-${item.eventId}`}>Highlight Subtitle</label>
                      <input
                        id={`highlight-subtitle-${item.eventId}`}
                        className="admin-events__input"
                        value={editForm.highlightSubtitle}
                        onChange={(e) => updateEditField("highlightSubtitle", e.target.value)}
                      />
                    </div>
                    <div className="admin-events__field">
                      <label className="admin-events__label" htmlFor={`highlight-description-${item.eventId}`}>Highlight Description</label>
                      <textarea
                        id={`highlight-description-${item.eventId}`}
                        className="admin-events__textarea"
                        rows={3}
                        value={editForm.highlightDescription}
                        onChange={(e) => updateEditField("highlightDescription", e.target.value)}
                        placeholder="Defaults to event description"
                      />
                    </div>
                    <div className="admin-events__field">
                      <label className="admin-events__label" htmlFor={`impact-text-${item.eventId}`}>Impact Text</label>
                      <textarea
                        id={`impact-text-${item.eventId}`}
                        className="admin-events__textarea"
                        rows={2}
                        value={editForm.impactText}
                        onChange={(e) => updateEditField("impactText", e.target.value)}
                        placeholder="An unforgettable V.O.I.C.E. NL experience filled with culture, connection and shared memories."
                      />
                    </div>
                    <div className="admin-events__field-row">
                      <div className="admin-events__field">
                        <label className="admin-events__label">Highlight Thumbnail</label>
                        <label className="admin-events__upload-btn">
                          <IconUpload size={16} /> Upload thumbnail
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                            onChange={(e) => handleThumbnailUpload(item.eventId, e)}
                          />
                        </label>
                        {editForm.highlightThumbnailImageUrl ? (
                          <img src={editForm.highlightThumbnailImageUrl} alt="" className="admin-events__hero-preview" />
                        ) : null}
                      </div>
                      <div className="admin-events__field">
                        <label className="admin-events__label" htmlFor={`gallery-url-${item.eventId}`}>Gallery URL (optional)</label>
                        <input
                          id={`gallery-url-${item.eventId}`}
                          className="admin-events__input"
                          value={editForm.galleryUrl}
                          onChange={(e) => updateEditField("galleryUrl", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="admin-highlights__editor-actions">
                      <button
                        type="button"
                        className="admin-events__primary-btn"
                        disabled={savingId === item.eventId}
                        onClick={() => saveEdit(item.eventId)}
                      >
                        {savingId === item.eventId ? "Saving…" : "Save Highlight"}
                      </button>
                      <button type="button" className="admin-events__outline-btn" onClick={cancelEdit}>
                        <IconX size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {preview ? (
          <div className="admin-highlights__preview" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
            <div className="admin-highlights__preview-panel" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="admin-highlights__preview-close" onClick={() => setPreview(null)}>
                Close
              </button>
              <div className="admin-highlights__preview-video">
                <iframe
                  src={`${preview.youtubeEmbedUrl}?rel=0&modestbranding=1`}
                  title={`${preview.highlightTitle} preview`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <h3>{preview.highlightTitle}</h3>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
