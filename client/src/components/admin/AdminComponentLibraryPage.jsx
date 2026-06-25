import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconDeviceFloppy, IconPlus, IconRocket, IconTrash } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import CmsSectionEditor from "./cms/CmsSectionEditor.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { canPublishPages, canWritePages, formatSectionType } from "../../utils/pagesAdmin.js";
import "../../styles/admin-cms-page.css";

export default function AdminComponentLibraryPage() {
  const { admin } = useAdminAuth();
  const readOnly = !canWritePages(admin?.role);
  const canPublish = canPublishPages(admin?.role);
  const [blocks, setBlocks] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newBlock, setNewBlock] = useState({ name: "", sectionType: "text", category: "general" });
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [activeDraft, setActiveDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [blockData, configData] = await Promise.all([
        apiFetch("/api/admin/component-library", { headers: adminAuthHeaders() }),
        apiFetch("/api/admin/pages/config", { headers: adminAuthHeaders() }).catch(() => null),
      ]);
      setBlocks(blockData.blocks || []);
      setConfig(configData);
    } catch (err) {
      setError(err.message || "Could not load the component library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    try {
      const block = await apiFetch("/api/admin/component-library", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify(newBlock),
      });
      setShowCreate(false);
      setNewBlock({ name: "", sectionType: "text", category: "general" });
      await load();
      openBlock(block);
    } catch (err) {
      alert(err.message || "Could not create block.");
    }
  }

  function openBlock(block) {
    setActiveBlockId(block.blockId);
    setActiveDraft({ ...block.draft, sectionType: block.sectionType, title: block.name, isVisible: true });
  }

  async function saveActive(publish = false) {
    if (!activeBlockId || !activeDraft) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/component-library/${activeBlockId}`, {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify({
          content: activeDraft.content,
          images: activeDraft.images,
          ctas: activeDraft.ctas,
          settings: activeDraft.settings,
        }),
      });
      if (publish) {
        await apiFetch(`/api/admin/component-library/${activeBlockId}/publish`, {
          method: "POST",
          headers: adminAuthHeaders(),
        });
      }
      await load();
    } catch (err) {
      alert(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(blockId) {
    if (!window.confirm("Delete this reusable block? This only works if it isn't used on any page.")) return;
    try {
      await apiFetch(`/api/admin/component-library/${blockId}`, { method: "DELETE", headers: adminAuthHeaders() });
      if (activeBlockId === blockId) {
        setActiveBlockId(null);
        setActiveDraft(null);
      }
      load();
    } catch (err) {
      alert(err.message || "Delete failed — it may still be in use on a page.");
    }
  }

  const activeBlock = blocks.find((b) => b.blockId === activeBlockId);

  if (activeBlockId && activeDraft) {
    return (
      <AdminLayout pageTitle={`Block: ${activeBlock?.name || ""}`} pageSubtitle="Edit once — every page using this block updates on publish." hideBottomNav>
        <div className="admin-cms admin-cms--editor">
          <div className="admin-cms__editor-topbar">
            <button type="button" className="admin-cms__back" onClick={() => { setActiveBlockId(null); setActiveDraft(null); }}>
              <IconArrowLeft size={18} /> Component Library
            </button>
            {!readOnly ? (
              <div className="admin-cms__editor-actions">
                <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={() => saveActive(false)} disabled={saving}>
                  <IconDeviceFloppy size={16} /> Save draft
                </button>
                {canPublish ? (
                  <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={() => saveActive(true)} disabled={saving}>
                    <IconRocket size={16} /> Publish
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="admin-cms__status" style={{ fontSize: 13 }}>
            Used on {activeBlock?.usageCount || 0} section(s) across the site.
          </p>
          <CmsSectionEditor section={activeDraft} onChange={setActiveDraft} config={config} readOnly={readOnly} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Component Library" pageSubtitle="Reusable blocks — edit once, update everywhere they're used.">
      <div className="admin-cms">
        {error ? <p className="admin-cms__error">{error}</p> : null}
        {loading ? <p className="admin-cms__status">Loading…</p> : null}

        <div className="admin-cms__toolbar">
          <div className="admin-cms__toolbar-info">
            <span>{blocks.length} block(s)</span>
          </div>
          {!readOnly ? (
            <div className="admin-cms__toolbar-actions">
              <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={() => setShowCreate(true)}>
                <IconPlus size={16} /> New block
              </button>
            </div>
          ) : null}
        </div>

        {showCreate ? (
          <form className="admin-cms__create-card" onSubmit={handleCreate}>
            <h3>Create reusable block</h3>
            <input className="admin-cms__input" placeholder="Block name" value={newBlock.name} onChange={(e) => setNewBlock((p) => ({ ...p, name: e.target.value }))} required />
            <select className="admin-cms__input" value={newBlock.sectionType} onChange={(e) => setNewBlock((p) => ({ ...p, sectionType: e.target.value }))}>
              {(config?.sectionTypes || ["text", "hero", "cta_banner"]).map((t) => (
                <option key={t} value={t}>{formatSectionType(t)}</option>
              ))}
            </select>
            <input className="admin-cms__input" placeholder="Category (optional)" value={newBlock.category} onChange={(e) => setNewBlock((p) => ({ ...p, category: e.target.value }))} />
            <div className="admin-cms__create-actions">
              <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="admin-cms__btn admin-cms__btn--primary">Create</button>
            </div>
          </form>
        ) : null}

        <div className="admin-cms__table-wrap">
          <table className="admin-cms__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Used on</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.blockId}>
                  <td><strong>{block.name}</strong></td>
                  <td><code>{formatSectionType(block.sectionType)}</code></td>
                  <td>{block.category}</td>
                  <td>{block.usageCount} section(s)</td>
                  <td>
                    <div className="admin-cms__actions">
                      <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--primary" onClick={() => openBlock(block)}>
                        Edit
                      </button>
                      {!readOnly ? (
                        <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--danger" onClick={() => handleDelete(block.blockId)}>
                          <IconTrash size={14} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!blocks.length && !loading ? (
                <tr><td colSpan={5} className="admin-cms__empty">No reusable blocks yet. Create one to use across multiple pages.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 16 }}>
          <Link to="/admin/cms" className="admin-cms__back"><IconArrowLeft size={16} /> Back to CMS</Link>
        </p>
      </div>
    </AdminLayout>
  );
}
