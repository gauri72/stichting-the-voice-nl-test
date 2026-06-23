import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../AdminLayout.jsx";
import { fetchGlobalDocuments, formatEventDate } from "../../../utils/eventOperationsAdmin.js";
import "../../../styles/event-operations.css";

export default function AdminGlobalDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (yearFilter) params.year = yearFilter;
      if (eventFilter) params.eventId = eventFilter;
      const data = await fetchGlobalDocuments(params);
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, yearFilter, eventFilter]);

  useEffect(() => {
    const t = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, search]);

  const years = [...new Set(documents.map((d) => new Date(d.uploadedDate).getFullYear()))].sort((a, b) => b - a);
  const events = [...new Map(documents.filter((d) => d.event).map((d) => [d.event.id, d.event])).values()];

  return (
    <AdminLayout pageTitle="Global Document Library" pageSubtitle="All event documents across operations">
      <div className="event-ops__page">
        <div className="event-ops__filters admin-events__form-grid">
          <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Document name, tags…" /></label>
          <label>Category
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Contract">Contract</option>
              <option value="Invoice">Invoice</option>
              <option value="Permit">Permit</option>
              <option value="Marketing">Marketing</option>
            </select>
          </label>
          <label>Year
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">All</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label>Event
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
              <option value="">All events</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </label>
        </div>

        {loading ? <p className="admin-events__hint">Loading documents…</p> : null}

        <div className="event-ops__cards-grid">
          {documents.map((doc) => (
            <article key={doc.id} className="event-ops__mobile-card">
              <span className="event-ops__badge">{doc.category}</span>
              <h3>{doc.documentName}</h3>
              <p>{doc.event?.title || "Event"} · {formatEventDate(doc.event?.date)}</p>
              <p className="event-ops__muted">v{doc.currentVersion} · {doc.fileType}</p>
              <div className="event-ops__btn-row">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="admin-events__outline-btn">Preview</a>
                <a href={doc.fileUrl} download className="admin-events__outline-btn">Download</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
