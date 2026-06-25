import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  exportOperations,
  fetchChecklists,
  fetchVendors,
  saveChecklistItem,
} from "../../../utils/eventOperationsAdmin.js";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";

function StatCard({ label, value, hint }) {
  return (
    <div className="event-ops__stat-card">
      <span className="event-ops__stat-value">{value}</span>
      <span className="event-ops__stat-label">{label}</span>
      {hint ? <span className="event-ops__stat-hint">{hint}</span> : null}
    </div>
  );
}

export default function EventOperationsOverviewPage() {
  const { eventId } = useParams();
  const { overview, reloadOverview } = useOutletContext();
  const [checklists, setChecklists] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [notes, setNotes] = useState(overview?.event?.operationsNotes || "");
  const [message, setMessage] = useState("");
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    setLoadingExtra(true);
    Promise.all([fetchChecklists(eventId), fetchVendors(eventId)])
      .then(([cl, v]) => {
        setChecklists(cl.items || []);
        setVendors(v.vendors || []);
      })
      .finally(() => setLoadingExtra(false));
  }, [eventId]);

  useEffect(() => {
    setNotes(overview?.event?.operationsNotes || "");
  }, [overview?.event?.operationsNotes]);

  const stats = overview?.stats || {};

  async function toggleChecklist(item) {
    const next = item.status === "Done" ? "Open" : "Done";
    try {
      await saveChecklistItem(eventId, { status: next }, item.id);
      const cl = await fetchChecklists(eventId);
      setChecklists(cl.items || []);
      reloadOverview?.();
    } catch (err) {
      setMessage(err.message || "Could not update checklist item.");
    }
  }

  async function saveNotes() {
    try {
      await apiFetch(`/api/admin/events/${eventId}/operations`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ operationsNotes: notes }),
      });
      setMessage("Notes saved.");
      reloadOverview?.();
    } catch (err) {
      setMessage(err.message || "Could not save notes.");
    }
  }

  async function handleExport(type) {
    try {
      await exportOperations(eventId, type);
    } catch (err) {
      setMessage(err.message || "Export failed.");
    }
  }

  const sections = [
    { to: "inventory", title: "Inventory", desc: "Track items, suppliers and returns" },
    { to: "technical-rider", title: "Technical Rider", desc: "Sound, lighting, stage and staff requirements" },
    { to: "stage-plan", title: "Stage Plan", desc: "Floor layout and element placement" },
    { to: "documents", title: "Documents", desc: "Contracts, permits, invoices and assets" },
  ];

  return (
    <div className="event-ops__page">
      <div className="event-ops__stats-grid">
        <StatCard label="Total inventory" value={stats.totalInventoryItems ?? 0} />
        <StatCard label="Items arranged" value={stats.itemsArranged ?? 0} />
        <StatCard label="Items pending" value={stats.itemsPending ?? 0} />
        <StatCard label="Rider completion" value={`${stats.technicalRiderCompletion ?? 0}%`} />
        <StatCard label="Documents uploaded" value={stats.documentsUploaded ?? 0} />
        <StatCard label="Missing documents" value={stats.missingDocuments ?? 0} />
        <StatCard label="Vendor confirmations" value={`${stats.vendorConfirmations ?? 0}/${stats.vendorsTotal ?? 0}`} />
        <StatCard label="Open tasks" value={stats.openTasks ?? 0} />
      </div>

      <div className="event-ops__grid-2">
        <section className="admin-events__card">
          <h2>Sections</h2>
          <ul className="event-ops__section-list">
            {sections.map((s) => (
              <li key={s.to}>
                <Link to={`/admin/events/${eventId}/${s.to}`} className="event-ops__section-link">
                  <strong>{s.title}</strong>
                  <span>{s.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-events__card">
          <h2>Exports</h2>
          <div className="event-ops__btn-row">
            <button type="button" className="admin-events__outline-btn" onClick={() => handleExport("inventory_pdf")}>Inventory PDF</button>
            <button type="button" className="admin-events__outline-btn" onClick={() => handleExport("inventory_csv")}>Inventory CSV</button>
            <button type="button" className="admin-events__outline-btn" onClick={() => handleExport("technical_rider_pdf")}>Technical Rider PDF</button>
            <button type="button" className="admin-events__outline-btn" onClick={() => handleExport("checklist_pdf")}>Checklist PDF</button>
            <button type="button" className="admin-events__outline-btn" onClick={() => handleExport("documents_pdf")}>Document List PDF</button>
          </div>
        </section>
      </div>

      <section className="admin-events__card">
        <h2>Checklists</h2>
        {loadingExtra ? <p className="admin-events__hint">Loading checklist…</p> : null}
        <ul className="event-ops__checklist">
          {checklists.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`event-ops__check-btn${item.status === "Done" ? " event-ops__check-btn--done" : ""}`}
                onClick={() => toggleChecklist(item)}
              >
                {item.status === "Done" ? "✓" : ""}
              </button>
              <span>{item.task}</span>
              <span className="event-ops__badge">{item.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-events__card">
        <h2>Vendors</h2>
        {vendors.length === 0 ? (
          <p className="admin-events__hint">No vendors linked yet. Add vendors from the Inventory or Documents sections.</p>
        ) : (
          <ul className="event-ops__vendor-list">
            {vendors.map((v) => (
              <li key={v.id}>
                <strong>{v.vendorName}</strong>
                <span>{v.serviceType}</span>
                <span className={`event-ops__badge${v.confirmed ? " event-ops__badge--ok" : ""}`}>
                  {v.confirmed ? "Confirmed" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-events__card">
        <h2>Notes</h2>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Operational notes for this event…"
        />
        <button type="button" className="admin-events__primary-btn" onClick={saveNotes}>Save notes</button>
        {message ? <p className="admin-events__hint">{message}</p> : null}
      </section>

      <p className="admin-events__hint">
        Budget links: manage event budgets in{" "}
        <Link to="/admin/finance/event-budgets">Finance → Event Budgets</Link>.
      </p>
    </div>
  );
}
