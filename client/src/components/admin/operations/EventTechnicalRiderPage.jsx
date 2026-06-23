import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  deleteRiderItem,
  exportOperations,
  fetchEventsPicker,
  fetchOpsConfig,
  fetchTechnicalRider,
  saveRiderItem,
} from "../../../utils/eventOperationsAdmin.js";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";

const EMPTY = {
  section: "Sound",
  requirement: "",
  quantity: 1,
  specification: "",
  responsiblePerson: "",
  supplier: "",
  status: "Needed",
  notes: "",
};

const PRESETS = {
  Sound: ["DJ setup", "Microphones", "Wireless mics", "Speakers", "Monitors", "Mixer", "Cables", "Laptop input", "AUX/Bluetooth", "Power requirements"],
  Lighting: ["Stage lights", "Ambient lights", "Moving heads", "Spotlights", "Uplighting", "DMX controller"],
  Stage: ["Stage size", "Stage height", "Backdrop", "DJ booth", "Podium", "Dance floor", "Performer area"],
  "Video / Visuals": ["Projector", "LED screen", "HDMI input", "Presentation laptop", "Camera setup", "Live streaming"],
  Power: ["Number of sockets", "Extension cables", "Power load", "Backup power"],
  Staff: ["Sound engineer", "Light engineer", "Stage manager", "DJ", "Host", "Volunteer team"],
};

export default function EventTechnicalRiderPage() {
  const { eventId } = useParams();
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("");
  const [copyFromId, setCopyFromId] = useState("");
  const [events, setEvents] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = sectionFilter ? { section: sectionFilter } : {};
      const [data, cfg] = await Promise.all([
        fetchTechnicalRider(eventId, params),
        fetchOpsConfig(eventId),
      ]);
      setItems(data.items || []);
      setConfig(cfg);
    } catch (err) {
      setError(err.message || "Could not load technical rider.");
    } finally {
      setLoading(false);
    }
  }, [eventId, sectionFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchEventsPicker(eventId).then((d) => setEvents(d.events || [])).catch(() => {});
  }, [eventId]);

  async function handleSave(e) {
    e.preventDefault();
    await saveRiderItem(eventId, form, editingId);
    setShowForm(false);
    load();
  }

  async function addPreset(section, requirement) {
    await saveRiderItem(eventId, { section, requirement, quantity: 1, status: "Needed" });
    load();
  }

  return (
    <div className="event-ops__page">
      <div className="event-ops__toolbar-row">
        <button type="button" className="admin-events__primary-btn event-ops__fab" onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }}>+ Add requirement</button>
        <button type="button" className="admin-events__outline-btn" onClick={() => exportOperations(eventId, "technical_rider_pdf")}>Export PDF</button>
        <label className="event-ops__inline-copy">
          Section
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All sections</option>
            {(config.riderSections || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="event-ops__inline-copy">
          Copy from
          <select value={copyFromId} onChange={(e) => setCopyFromId(e.target.value)}>
            <option value="">Event…</option>
            {events.filter((ev) => ev.id !== eventId).map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          <button
            type="button"
            className="admin-events__outline-btn"
            disabled={!copyFromId}
            onClick={async () => {
              await apiFetch(`/api/admin/events/${eventId}/technical-rider/copy-from-event`, {
                method: "POST",
                headers: adminAuthHeaders(),
                body: JSON.stringify({ sourceEventId: copyFromId }),
              });
              load();
            }}
          >
            Copy
          </button>
        </label>
      </div>

      {error ? <p className="admin-events__error">{error}</p> : null}
      {loading ? <p className="admin-events__hint">Loading…</p> : null}

      <div className="event-ops__rider-presets">
        {(config.riderSections || []).map((section) => (
          <details key={section} className="admin-events__card">
            <summary>Quick add — {section}</summary>
            <div className="event-ops__preset-chips">
              {(PRESETS[section] || []).map((req) => (
                <button key={req} type="button" className="event-ops__chip" onClick={() => addPreset(section, req)}>{req}</button>
              ))}
            </div>
          </details>
        ))}
      </div>

      <div className="event-ops__cards-grid">
        {items.map((item) => (
          <article key={item.id} className="event-ops__mobile-card">
            <span className="event-ops__badge">{item.section}</span>
            <h3>{item.requirement}</h3>
            <p>×{item.quantity} · {item.status}</p>
            {item.specification ? <p className="event-ops__muted">{item.specification}</p> : null}
            <div className="event-ops__btn-row">
              <button type="button" className="admin-events__outline-btn" onClick={() => { setForm(item); setEditingId(item.id); setShowForm(true); }}>Edit</button>
              <button type="button" className="admin-events__outline-btn" onClick={() => deleteRiderItem(eventId, item.id).then(load)}>Delete</button>
            </div>
          </article>
        ))}
      </div>

      {showForm ? (
        <div className="event-ops__modal-backdrop" onClick={() => setShowForm(false)} role="presentation">
          <form className="event-ops__modal admin-events__card" onSubmit={handleSave} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit requirement" : "Add requirement"}</h2>
            <div className="admin-events__form-grid">
              <label>Section
                <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                  {(config.riderSections || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>Requirement<input required value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} /></label>
              <label>Quantity<input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></label>
              <label>Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {(config.riderStatuses || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>Responsible<input value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} /></label>
              <label>Supplier<input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></label>
              <label className="event-ops__full-width">Specification<textarea rows={2} value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} /></label>
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
