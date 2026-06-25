import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconArrowLeft, IconTemplate } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-cms-page.css";

export default function AdminTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [form, setForm] = useState({ title: "", slug: "", route: "" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/page-templates", { headers: adminAuthHeaders() });
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message || "Could not load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startFromTemplate(template) {
    setActiveTemplate(template);
    setForm({ title: template.name, slug: "", route: "" });
  }

  async function handleCreate(event) {
    event.preventDefault();
    const slug = (form.slug || form.title).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setCreating(true);
    try {
      const page = await apiFetch("/api/admin/page-templates/create-page", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          templateId: activeTemplate.templateId,
          title: form.title.trim(),
          slug,
          route: form.route.trim() || `/${slug}`,
        }),
      });
      navigate(`/admin/cms/pages/${page.slug}/visual-editor`);
    } catch (err) {
      alert(err.message || "Could not create page from template.");
    } finally {
      setCreating(false);
    }
  }

  if (activeTemplate) {
    return (
      <AdminLayout pageTitle={`New page from "${activeTemplate.name}"`} pageSubtitle={activeTemplate.description}>
        <div className="admin-cms">
          <button type="button" className="admin-cms__back" onClick={() => setActiveTemplate(null)}>
            <IconArrowLeft size={16} /> Templates
          </button>
          <form className="admin-cms__create-card" onSubmit={handleCreate}>
            <h3>Page details</h3>
            <input className="admin-cms__input" placeholder="Page title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <input className="admin-cms__input" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
            <input className="admin-cms__input" placeholder="Route (e.g. /our-campaign)" value={form.route} onChange={(e) => setForm((p) => ({ ...p, route: e.target.value }))} />
            <div className="admin-cms__create-actions">
              <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={() => setActiveTemplate(null)}>Cancel</button>
              <button type="submit" className="admin-cms__btn admin-cms__btn--primary" disabled={creating}>Create page</button>
            </div>
          </form>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Templates" pageSubtitle="Create a new page starting from a ready-made layout.">
      <div className="admin-cms">
        {error ? <p className="admin-cms__error">{error}</p> : null}
        {loading ? <p className="admin-cms__status">Loading…</p> : null}
        <div className="admin-cms-hub__grid">
          {templates.map((template) => (
            <button
              key={template.templateId}
              type="button"
              className="admin-cms-hub__tile"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => startFromTemplate(template)}
            >
              <IconTemplate size={28} stroke={1.5} />
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <span className="admin-cms__tag">{template.sectionBlueprint?.length || 0} sections</span>
            </button>
          ))}
        </div>
        <p style={{ marginTop: 16 }}>
          <Link to="/admin/cms" className="admin-cms__back"><IconArrowLeft size={16} /> Back to CMS</Link>
        </p>
      </div>
    </AdminLayout>
  );
}
