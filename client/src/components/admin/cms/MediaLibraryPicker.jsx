import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import "../../../styles/admin-media-library.css";

/** Modal grid for picking an existing MediaAsset, used from CmsImageField as
 * an alternative to uploading a brand-new file. */
export default function MediaLibraryPicker({ open, onClose, onSelect }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    apiFetch("/api/admin/media-library?category=cms", { headers: adminAuthHeaders() })
      .then((data) => setAssets(data.assets || []))
      .catch((err) => setError(err.message || "Could not load media library."))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="admin-media-picker" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-media-picker__panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-media-picker__header">
          <h3>Choose from library</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        {error ? <p className="admin-cms__error">{error}</p> : null}
        {loading ? (
          <p className="admin-cms__status">Loading…</p>
        ) : !assets.length ? (
          <p className="admin-cms__empty">No assets in the library yet.</p>
        ) : (
          <div className="admin-media__grid">
            {assets.map((asset) => (
              <button
                key={asset.assetId}
                type="button"
                className="admin-media__card admin-media__card--pickable"
                onClick={() =>
                  onSelect({
                    url: asset.originalUrl,
                    originalUrl: asset.originalUrl,
                    optimizedUrl: asset.webpUrl || asset.originalUrl,
                    assetId: asset.assetId,
                    alt: asset.alt || "",
                    focusPosition: "center",
                  })
                }
              >
                <div className="admin-media__thumb">
                  <img src={asset.thumbnailUrl || asset.originalUrl} alt={asset.alt || asset.assetId} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
