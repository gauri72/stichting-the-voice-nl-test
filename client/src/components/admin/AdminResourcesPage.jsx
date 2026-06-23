import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const EMPTY = { name: "", type: "trainer", location: "" };

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch("/api/admin/resources", { headers: adminAuthHeaders() });
      setResources(data.resources || []);
    } catch (err) {
      setError(err.message || "Could not load resources.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createResource(e) {
    e.preventDefault();
    try {
      await apiFetch("/api/admin/resources", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message || "Could not create resource.");
    }
  }

  return (
    <AdminLayout pageTitle="Resources" pageSubtitle="Trainers, courts, rooms, tables, equipment and staff.">
      {error ? <p className="admin-tickets__error">{error}</p> : null}
      <form className="admin-events__card" onSubmit={createResource}>
        <header className="admin-events__card-header"><h2>Add Resource</h2></header>
        <div className="admin-events__card-body admin-events__ticket-editor-grid">
          <input className="admin-events__input" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <select className="admin-events__select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {["trainer", "coach", "court", "room", "table", "hall", "equipment", "instructor", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="admin-events__input" placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
        <footer className="admin-events__footer admin-events__footer--actions"><button className="admin-events__save-btn" type="submit">Create Resource</button></footer>
      </form>
      <section className="admin-events__card">
        <header className="admin-events__card-header"><h2>All Resources</h2></header>
        <div className="admin-events__card-body">
          <ul className="admin-events__list">
            {resources.map((r) => <li key={r.id} className="admin-events__list-item">{r.name} · {r.type} · {r.location || "—"}</li>)}
          </ul>
        </div>
      </section>
    </AdminLayout>
  );
}
