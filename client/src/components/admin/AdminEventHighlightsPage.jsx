import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconExternalLink,
  IconPlayerPlay,
  IconSearch,
  IconVideo,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-event-highlights-page.css";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "Video Available", label: "Video Available" },
  { id: "Coming Soon", label: "Coming Soon" },
  { id: "hidden", label: "Hidden" },
  { id: "featured", label: "Featured" },
];

export default function AdminEventHighlightsPage() {
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

  async function promptYoutubeLink(item) {
    const url = window.prompt("Paste YouTube highlight URL:", item.youtubeUrl || "");
    if (url === null) return;
    if (!url.trim()) {
      await patchHighlight(item.eventId, { youtubeHighlightUrl: "", highlightStatus: "Coming Soon" });
      return;
    }
    try {
      await apiFetch(`/api/admin/events/${item.eventId}/highlight/preview-youtube`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ url }),
      });
      await patchHighlight(item.eventId, { youtubeHighlightUrl: url, highlightStatus: "Video Available" });
    } catch (err) {
      setError(err.message || "Invalid YouTube URL.");
    }
  }

  return (
    <AdminLayout hideBottomNav>
      <div className="admin-highlights">
        <header className="admin-highlights__hero">
          <Link to="/admin/events" className="admin-highlights__back">
            <IconArrowLeft size={18} aria-hidden /> Back to Events
          </Link>
          <h1 className="admin-highlights__title">Event Highlights</h1>
          <p className="admin-highlights__subtitle">
            Manage YouTube videos and highlight content for completed events.
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
          {highlights.map((item) => (
            <li key={item.eventId} className="admin-highlights__card">
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
                  onClick={() => promptYoutubeLink(item)}
                >
                  <IconVideo size={16} aria-hidden />
                  {item.youtubeUrl ? "Edit Link" : "Add Link"}
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
                <Link to={`/admin/events?id=${item.eventId}`} className="admin-highlights__action">
                  <IconEdit size={16} aria-hidden />
                  Edit
                </Link>
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
            </li>
          ))}
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
