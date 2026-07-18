import { useCallback, useEffect, useRef, useState } from "react";
import { IconUpload, IconTrash, IconArchive, IconSearch } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { readImageFile, validateImageFile } from "../../utils/pagesAdmin.js";
import "../../styles/admin-media-library.css";

const CATEGORIES = ["cms", "events", "team", "logos", "reviews", "highlights", "business_profiles"];

export default function AdminMediaLibraryPage() {
  const [assets, setAssets] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      const data = await apiFetch(`/api/admin/media-library?${params.toString()}`, {
        headers: adminAuthHeaders(),
      });
      setAssets(data.assets || []);
      setConfigured(data.configured !== false);
    } catch (err) {
      setError(err.message || "Could not load media library.");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      validateImageFile(file);
      const dataUrl = await readImageFile(file);
      setUploading(true);
      await apiFetch("/api/admin/media-library", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ imageData: dataUrl, category: category || "cms" }),
      });
      await load();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(assetId) {
    try {
      await apiFetch(`/api/admin/media-library/${assetId}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      await load();
    } catch (err) {
      if (err.status === 409) {
        const locations = (err.data?.usage || []).map((u) => u.label || u.usedInId).join(", ");
        alert(`Can't delete — still used in: ${locations}`);
      } else {
        setError(err.message || "Delete failed.");
      }
    }
  }

  async function handleArchive(assetId) {
    try {
      await apiFetch(`/api/admin/media-library/${assetId}/archive`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      await load();
    } catch (err) {
      setError(err.message || "Archive failed.");
    }
  }

  return (
    <AdminLayout pageTitle="Media Library" pageSubtitle="S3-backed assets used across the CMS, with usage tracking.">
      {!configured ? (
        <p className="admin-media__warning">
          AWS isn't configured yet (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY) — uploads here will fail until that's set.
        </p>
      ) : null}
      {error ? <p className="admin-cms__error">{error}</p> : null}

      <div className="admin-media__toolbar">
        <div className="admin-media__search">
          <IconSearch size={16} />
          <input placeholder="Search by alt text…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <IconUpload size={16} /> {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={handleUpload} />
      </div>

      {loading ? (
        <p className="admin-cms__status">Loading…</p>
      ) : !assets.length ? (
        <p className="admin-cms__empty">No assets yet. Upload one to get started.</p>
      ) : (
        <div className="admin-media__grid">
          {assets.map((asset) => (
            <div key={asset.assetId} className="admin-media__card">
              <div className="admin-media__thumb">
                <img src={asset.thumbnailUrl || asset.originalUrl} alt={asset.alt || asset.assetId} />
              </div>
              <p className="admin-media__meta">{asset.category} · {Math.round((asset.sizeBytes || 0) / 1024)}KB</p>
              <p className="admin-media__usage">{asset.usageCount > 0 ? `Used in ${asset.usageCount} place(s)` : "Not used"}</p>
              <div className="admin-media__actions">
                <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => handleArchive(asset.assetId)} title="Archive">
                  <IconArchive size={14} />
                </button>
                <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--danger" onClick={() => handleDelete(asset.assetId)} title="Delete">
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
