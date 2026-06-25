import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../AdminLayout.jsx";
import {
  fetchGlobalInventory,
  readFileAsDataUrl,
  saveGlobalInventoryItem,
} from "../../../utils/eventOperationsAdmin.js";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import "../../../styles/admin-events-page.css";
import "../../../styles/event-operations.css";

const EMPTY = {
  itemName: "",
  category: "Miscellaneous",
  ownershipType: "Owned",
  quantityAvailable: 1,
  storageLocation: "",
  defaultSupplier: "",
  replacementCost: 0,
  notes: "",
  condition: "Good",
  status: "Available",
};

export default function AdminGlobalInventoryPage() {
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [assignEventId, setAssignEventId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const [data, cfg] = await Promise.all([
        fetchGlobalInventory(params),
        apiFetch("/api/admin/inventory/config", { headers: adminAuthHeaders() }),
      ]);
      setItems(data.items || []);
      setConfig(cfg);
      const ev = await apiFetch("/api/admin/events", { headers: adminAuthHeaders() });
      setEvents(ev.events || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [load, search]);

  async function handleSave(e) {
    e.preventDefault();
    let payload = { ...form };
    const fileInput = e.target.querySelector('input[type="file"]');
    if (fileInput?.files?.[0]) {
      payload.imageData = await readFileAsDataUrl(fileInput.files[0]);
    }
    await saveGlobalInventoryItem(payload, editingId);
    setShowForm(false);
    load();
  }

  return (
    <AdminLayout pageTitle="Global Inventory Library" pageSubtitle="Reusable items across all events">
      <div className="event-ops__page">
        <div className="event-ops__filters admin-events__form-grid">
          <label>Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Item name…" /></label>
        </div>
        <button type="button" className="admin-events__primary-btn event-ops__fab" onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }}>+ Add reusable item</button>
        {loading ? <p className="admin-events__hint">Loading…</p> : null}

        <div className="event-ops__cards-grid">
          {items.map((item) => (
            <article key={item.id} className="event-ops__mobile-card">
              {item.imageUrl ? <img src={item.imageUrl} alt="" className="event-ops__inv-thumb" /> : null}
              <h3>{item.itemName}</h3>
              <p>{item.category} · {item.ownershipType} · Qty {item.quantityAvailable}</p>
              <p className="event-ops__muted">{item.storageLocation}</p>
              <div className="event-ops__btn-row">
                <button type="button" className="admin-events__outline-btn" onClick={() => { setForm({ ...item, replacementCost: item.replacementCost ?? 0 }); setEditingId(item.id); setShowForm(true); }}>Edit</button>
                <select value={assignEventId} onChange={(e) => setAssignEventId(e.target.value)}>
                  <option value="">Assign to event…</option>
                  {(Array.isArray(events) ? events : []).map((ev) => (
                    <option key={ev.id || ev._id} value={ev.id || ev._id}>{ev.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-events__outline-btn"
                  disabled={!assignEventId}
                  onClick={async () => {
                    await apiFetch(`/api/admin/inventory/${item.id}/assign`, {
                      method: "POST",
                      headers: adminAuthHeaders(),
                      body: JSON.stringify({ eventId: assignEventId, quantity: 1 }),
                    });
                    load();
                  }}
                >
                  Assign
                </button>
              </div>
            </article>
          ))}
        </div>

        {showForm ? (
          <div className="event-ops__modal-backdrop" onClick={() => setShowForm(false)} role="presentation">
            <form className="event-ops__modal admin-events__card" onSubmit={handleSave} onClick={(e) => e.stopPropagation()}>
              <h2>{editingId ? "Edit item" : "Add reusable item"}</h2>
              <div className="admin-events__form-grid">
                <label>Item name<input required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></label>
                <label>Category
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {(config.inventoryCategories || []).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>Ownership
                  <select value={form.ownershipType} onChange={(e) => setForm({ ...form, ownershipType: e.target.value })}>
                    {(config.globalOwnershipTypes || []).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>Qty available<input type="number" min="0" value={form.quantityAvailable} onChange={(e) => setForm({ ...form, quantityAvailable: Number(e.target.value) })} /></label>
                <label>Storage location<input value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} /></label>
                <label>Replacement cost (€)<input type="number" min="0" step="0.01" value={form.replacementCost} onChange={(e) => setForm({ ...form, replacementCost: Number(e.target.value) })} /></label>
                <label className="event-ops__full-width">Image<input type="file" accept="image/*" /></label>
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
    </AdminLayout>
  );
}
