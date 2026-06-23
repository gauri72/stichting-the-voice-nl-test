import { formatDate } from "../../../utils/pagesAdmin.js";

export default function CmsVersionHistory({ versions = [], onRestore, readOnly = false }) {
  if (!versions.length) {
    return <p className="admin-cms__empty">No versions yet. Save a draft to create the first version.</p>;
  }

  return (
    <div className="admin-cms__versions">
      {versions.map((version) => (
        <div key={version.versionId} className="admin-cms__version-item">
          <div>
            <strong>{version.versionId}</strong>
            <span className={`admin-cms__badge admin-cms__badge--${version.status}`}>{version.status}</span>
          </div>
          <p>{version.changeNote || "No note"}</p>
          <small>{formatDate(version.createdAt)}</small>
          {!readOnly ? (
            <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => onRestore(version.versionId)}>
              Restore
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
