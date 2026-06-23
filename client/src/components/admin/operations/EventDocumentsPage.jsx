import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  deleteDocument,
  exportOperations,
  fetchDocumentVersions,
  fetchDocuments,
  fetchOpsConfig,
  readFileAsDataUrl,
  uploadDocument,
} from "../../../utils/eventOperationsAdmin.js";

export default function EventDocumentsPage() {
  const { eventId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionDocId, setVersionDocId] = useState(null);
  const [form, setForm] = useState({
    documentName: "",
    category: "Other",
    tags: "",
    notes: "",
    visibility: "Internal",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;
      const [data, cfg] = await Promise.all([fetchDocuments(eventId, params), fetchOpsConfig(eventId)]);
      setDocuments(data.documents || []);
      setConfig(cfg);
    } catch (err) {
      setError(err.message || "Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, [eventId, search, categoryFilter]);

  useEffect(() => {
    const t = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, search]);

  async function handleUpload(e) {
    e.preventDefault();
    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("Please select a file.");
      return;
    }
    const fileData = await readFileAsDataUrl(file);
    await uploadDocument(eventId, {
      ...form,
      fileData,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
    setShowUpload(false);
    setForm({ documentName: "", category: "Other", tags: "", notes: "", visibility: "Internal" });
    load();
  }

  async function showVersionHistory(docId) {
    const data = await fetchDocumentVersions(eventId, docId);
    setVersions(data.versions || []);
    setVersionDocId(docId);
  }

  return (
    <div className="event-ops__page">
      <div className="event-ops__filters admin-events__form-grid">
        <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Document name…" /></label>
        <label>Category
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All</option>
            {(config.documentCategories || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="event-ops__toolbar-row">
        <button type="button" className="admin-events__primary-btn event-ops__fab" onClick={() => setShowUpload(true)}>+ Upload document</button>
        <button type="button" className="admin-events__outline-btn" onClick={() => exportOperations(eventId, "documents_pdf")}>Export list PDF</button>
      </div>

      {error ? <p className="admin-events__error">{error}</p> : null}
      {loading ? <p className="admin-events__hint">Loading…</p> : null}

      <div className="event-ops__cards-grid">
        {documents.map((doc) => (
          <article key={doc.id} className="event-ops__mobile-card">
            <span className="event-ops__badge">{doc.category}</span>
            <h3>{doc.documentName}</h3>
            <p>v{doc.currentVersion} · {doc.fileType} · {doc.visibility}</p>
            <div className="event-ops__btn-row">
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="admin-events__outline-btn">Preview</a>
              <a href={doc.fileUrl} download className="admin-events__outline-btn">Download</a>
              <button type="button" className="admin-events__outline-btn" onClick={() => showVersionHistory(doc.id)}>Versions</button>
              <button type="button" className="admin-events__outline-btn" onClick={() => deleteDocument(eventId, doc.id).then(load)}>Archive</button>
            </div>
          </article>
        ))}
      </div>

      {showUpload ? (
        <div className="event-ops__modal-backdrop" onClick={() => setShowUpload(false)} role="presentation">
          <form className="event-ops__modal admin-events__card" onSubmit={handleUpload} onClick={(e) => e.stopPropagation()}>
            <h2>Upload document</h2>
            <div className="admin-events__form-grid">
              <label>Document name<input required value={form.documentName} onChange={(e) => setForm({ ...form, documentName: e.target.value })} /></label>
              <label>Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(config.documentCategories || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>Tags (comma-separated)<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
              <label>Visibility
                <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="Internal">Internal</option>
                  <option value="Team">Team</option>
                  <option value="Finance">Finance</option>
                </select>
              </label>
              <label className="event-ops__full-width">File<input type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.csv" /></label>
              <label className="event-ops__full-width">Notes<textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            </div>
            <div className="event-ops__btn-row">
              <button type="submit" className="admin-events__primary-btn">Upload</button>
              <button type="button" className="admin-events__outline-btn" onClick={() => setShowUpload(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      {versionDocId ? (
        <div className="event-ops__modal-backdrop" onClick={() => setVersionDocId(null)} role="presentation">
          <div className="event-ops__modal admin-events__card" onClick={(e) => e.stopPropagation()}>
            <h2>Version history</h2>
            <ul className="event-ops__version-list">
              {versions.map((v) => (
                <li key={v.id}>
                  <strong>v{v.version}</strong> — {v.uploadedByName || "Admin"} — {new Date(v.uploadedAt).toLocaleString()}
                  <p>{v.changeNote}</p>
                  <a href={v.fileUrl} download className="admin-events__outline-btn">Download</a>
                </li>
              ))}
            </ul>
            <button type="button" className="admin-events__outline-btn" onClick={() => setVersionDocId(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
