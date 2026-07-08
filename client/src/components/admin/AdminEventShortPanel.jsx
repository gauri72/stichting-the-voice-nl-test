import { useEffect, useState } from "react";
import { IconBrandYoutube, IconDeviceFloppy } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import useYoutubePlayer from "../event-experience/shorts/useYoutubePlayer.js";

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (!total) return "";
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Self-contained — fetches its own current values via GET .../short and
 * saves via its own PATCH .../short, independent of the main event form's
 * load/save/publish flow (the main form's event payload, built by
 * eventService.js's formatEvent, doesn't carry these fields). Only
 * rendered when editing an existing (already-saved) event, since it needs
 * a real event id.
 */
export default function AdminEventShortPanel({ eventId }) {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [duration, setDuration] = useState(0);
  const [includeInCarousel, setIncludeInCarousel] = useState(false);
  const [featureInCarousel, setFeatureInCarousel] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/admin/events/${eventId}/short`, { headers: adminAuthHeaders() })
      .then((data) => {
        if (cancelled) return;
        setUrl(data.youtubeShortUrl || "");
        setVideoId(data.youtubeShortVideoId || "");
        setThumbnail(data.youtubeThumbnail || "");
        setDuration(data.youtubeDuration || 0);
        setIncludeInCarousel(Boolean(data.youtubeShortUrl));
        setFeatureInCarousel(Boolean(data.featureInCarousel));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // A hidden, throwaway player whose only job is to read getDuration() once
  // ready — the same hook the public Shorts carousel uses for real preview
  // playback. Only mounts while a videoId is known and duration is still
  // unresolved; tears itself down once useYoutubePlayer's effect cleans up.
  const { containerRef } = useYoutubePlayer({
    videoId,
    enabled: Boolean(videoId) && !duration,
    muted: true,
    onReady: (player) => {
      const d = player.getDuration?.();
      if (d) setDuration(Math.round(d));
    },
  });

  async function handleUrlBlur() {
    const trimmed = url.trim();
    if (!trimmed) {
      setVideoId("");
      setThumbnail("");
      setDuration(0);
      return;
    }
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const data = await apiFetch(`/api/admin/events/${eventId}/short/preview`, {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ url: trimmed }),
      });
      setVideoId(data.preview.videoId);
      setThumbnail(data.preview.thumbnailUrl);
      setDuration(0); // reset so the hidden player re-probes for the new video
      setIncludeInCarousel(true);
    } catch (err) {
      setPreviewError(err.message || "Could not read that YouTube URL.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSavedMessage("");
    try {
      await apiFetch(`/api/admin/events/${eventId}/short`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          youtubeShortUrl: includeInCarousel ? url.trim() : "",
          youtubeShortVideoId: includeInCarousel ? videoId : "",
          youtubeThumbnail: includeInCarousel ? thumbnail : "",
          youtubeDuration: includeInCarousel ? duration : 0,
          featureInCarousel: includeInCarousel && featureInCarousel,
        }),
      });
      setSavedMessage("Saved — this Short is now live in the Event Experience carousel.");
    } catch (err) {
      setSavedMessage(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-events__card">
      <header className="admin-events__card-header admin-events__card-header--centered">
        <div className="admin-events__card-heading admin-events__card-heading--centered">
          <span className="admin-events__card-icon">
            <IconBrandYoutube size={20} />
          </span>
          <h2>Event Experience — YouTube Short</h2>
        </div>
      </header>
      <div className="admin-events__card-body">
        {!loaded ? <p className="admin-events__field-hint">Loading…</p> : null}
        <div className="admin-events__field">
          <label className="admin-events__label" htmlFor="evx-short-url">
            YouTube Short URL
          </label>
          <input
            id="evx-short-url"
            className="admin-events__input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://www.youtube.com/shorts/..."
          />
          {previewError ? <p className="admin-events__field-error">{previewError}</p> : null}
        </div>

        {previewLoading ? <p className="admin-events__field-hint">Fetching preview…</p> : null}

        {thumbnail ? (
          <div className="admin-event-short__preview">
            <img src={thumbnail} alt="" className="admin-event-short__thumb" />
            <span className="admin-events__field-hint">
              {duration ? `Duration: ${formatDuration(duration)}` : "Detecting duration…"}
            </span>
          </div>
        ) : null}

        {/* Hidden — never visible, exists only so the IFrame API can read duration. */}
        <div ref={containerRef} className="admin-event-short__hidden-probe" aria-hidden="true" />

        <label className="admin-events__toggle admin-events__toggle--inline">
          <input
            type="checkbox"
            checked={includeInCarousel}
            onChange={(e) => setIncludeInCarousel(e.target.checked)}
          />
          <span className="admin-events__toggle-track" />
          <span>Include in Event Shorts carousel</span>
        </label>
        <label className="admin-events__toggle admin-events__toggle--inline">
          <input
            type="checkbox"
            checked={featureInCarousel}
            disabled={!includeInCarousel}
            onChange={(e) => setFeatureInCarousel(e.target.checked)}
          />
          <span className="admin-events__toggle-track" />
          <span>Feature in Featured Event Shorts row</span>
        </label>

        <button type="button" className="admin-events__outline-btn" onClick={handleSave} disabled={saving}>
          <IconDeviceFloppy size={18} />
          {saving ? "Saving…" : "Save Short"}
        </button>
        {savedMessage ? <p className="admin-events__field-hint">{savedMessage}</p> : null}
      </div>
    </section>
  );
}
