import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  copyInventoryFromEvent,
  deleteInventoryItem,
  duplicateInventoryItem,
  exportOperations,
  fetchEventsPicker,
  fetchInventory,
  fetchOpsConfig,
  saveInventoryItem,
} from "../../../utils/eventOperationsAdmin.js";

const EMPTY = {
  itemName: "",
  category: "Miscellaneous",
  quantityNeeded: 1,
  quantityConfirmed: 0,
  quantityUsed: 0,
  unit: "pcs",
  source: "",
  owner: "",
  supplierVendor: "",
  cost: 0,
  deposit: 0,
  returnRequired: false,
  returnStatus: "",
  conditionBefore: "",
  conditionAfter: "",
  notes: "",
  assignedTeamMember: "",
  status: "Needed",
};

export default function EventInventoryPage() {
  const { eventId } = useParams();
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState({ inventoryCategories: [], inventoryStatuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [copyFromId, setCopyFromId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const [data, cfg] = await Promise.all([
        fetchInventory(eventId, params),
        fetchOpsConfig(eventId),
      ]);
      setItems(data.items || []);
      setConfig(cfg);
    } catch (err) {
      setError(err.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }, [eventId, search, statusFilter]);

  useEffect(() => {
    const t = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    fetchEventsPicker(eventId).then((d) => setEvents(d.events || [])).catch(() => {});
  }, [eventId]);

  function openNew() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({ ...item, cost: item.cost ?? 0, deposit: item.deposit ?? 0 });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    try {
      await saveInventoryItem(eventId, form, editingId);
      setShowForm(false);
      setMessage(editingId ? "Item updated." : "Item added.");
      await load();
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  }

  async function quickStatus(item, status) {
    await saveInventoryItem(eventId, { status }, item.id);
    await load();
  }

  return (
    <div className="event-ops__page">
      <div className="event-ops__filters admin-events__form-grid">
        <label>
          Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Item name…" />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {(config.inventoryStatuses || []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="event-ops__toolbar-row">
        <button type="button" className="admin-events__primary-btn event-ops__fab" onClick={openNew}>+ Add item</button>
        <button type="button" className="admin-events__outline-btn" onClick={() => exportOperations(eventId, "inventory_csv")}>Export CSV</button>
        <button type="button" className="admin-events__outline-btn" onClick={() => exportOperations(eventId, "inventory_pdf")}>Export PDF</button>
        <label className="event-ops__inline-copy">
          Copy from event
          <select value={copyFromId} onChange={(e) => setCopyFromId(e.target.value)}>
            <option value="">Select event…</option>
            {events.filter((ev) => ev.id !== eventId).map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <button
            type="button"
            className="admin-events__outline-btn"
            disabled={!copyFromId}
            onClick={async () => {
              await copyInventoryFromEvent(eventId, copyFromId);
              setMessage("Inventory copied.");
              load();
            }}
          >
            Copy
          </button>
        </label>
      </div>

      {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}
      {loading ? <p className="admin-events__hint">Loading inventory…</p> : null}

      <div className="event-ops__cards-desktop-hide">
        {items.map((item) => (
          <article key={item.id} className="event-ops__mobile-card">
            <h3>{item.itemName}</h3>
            <p>{item.category} · Qty {item.quantityNeeded} · {item.status}</p>
            <div className="event-ops__btn-row">
              <button type="button" className="admin-events__outline-btn" onClick={() => openEdit(item)}>Edit</button>
              <button type="button" className="admin-events__outline-btn" onClick={() => quickStatus(item, "Confirmed")}>Confirm</button>
            </div>
          </article>
        ))}
      </div>

      <section className="admin-events__card event-ops__table-wrap">
        <table className="admin-tickets__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Supplier</th>
              <th>Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.itemName}</td>
                <td>{item.category}</td>
                <td>{item.quantityConfirmed}/{item.quantityNeeded}</td>
                <td><span className="event-ops__badge">{item.status}</span></td>
                <td>{item.supplierVendor || "—"}</td>
                <td>€{Number(item.cost || 0).toFixed(2)}</td>
                <td className="event-ops__actions">
                  <button type="button" className="admin-events__outline-btn" onClick={() => openEdit(item)}>Edit</button>
                  <button type="button" className="admin-events__outline-btn" onClick={() => quickStatus(item, "Confirmed")}>Confirm</button>
                  <button type="button" className="admin-events__outline-btn" onClick={() => quickStatus(item, "Delivered")}>Delivered</button>
                  <button type="button" className="admin-events__outline-btn" onClick={() => duplicateInventoryItem(eventId, item.id).then(load)}>Duplicate</button>
                  <button type="button" className="admin-events__outline-btn" onClick={() => deleteInventoryItem(eventId, item.id).then(load)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {showForm ? (
        <div className="event-ops__modal-backdrop" role="presentation" onClick={() => setShowForm(false)}>
          <form className="event-ops__modal admin-events__card" onSubmit={handleSave} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit item" : "Add inventory item"}</h2>
            <div className="admin-events__form-grid">
              <label>Item name<input required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></label>
              <label>Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(config.inventoryCategories || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>Qty needed<input type="number" min="0" value={form.quantityNeeded} onChange={(e) => setForm({ ...form, quantityNeeded: Number(e.target.value) })} /></label>
              <label>Qty confirmed<input type="number" min="0" value={form.quantityConfirmed} onChange={(e) => setForm({ ...form, quantityConfirmed: Number(e.target.value) })} /></label>
              <label>Unit<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></label>
              <label>Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {(config.inventoryStatuses || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>Supplier<input value={form.supplierVendor} onChange={(e) => setForm({ ...form, supplierVendor: e.target.value })} /></label>
              <label>Cost (€)<input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></label>
              <label>Assigned to<input value={form.assignedTeamMember} onChange={(e) => setForm({ ...form, assignedTeamMember: e.target.value })} /></label>
              <label className="event-ops__full-width">Notes<textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            </div>
            <div className="event-ops__btn-row">
              <button type="submit" className="admin-events__primary-btn">Save</button>
              <button type="button" className="admin-events__outline-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
