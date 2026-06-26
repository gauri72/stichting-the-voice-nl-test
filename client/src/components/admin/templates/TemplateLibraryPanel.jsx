import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconCopy, IconEdit, IconEye, IconSend, IconTrash, IconX } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import TemplatePreviewEditor from "./TemplatePreviewEditor.jsx";

const TYPE_LABELS = {
  newsletter: "Newsletter",
  event_announcement: "Event Announcement",
  promotional: "Promotional",
  transactional: "Transactional",
  welcome_email: "Welcome Email",
  custom: "Custom",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("nl-NL");
}

/** Small admin-facing dataset (tens to low hundreds of templates) — filtering in-memory here
 * matches the existing listTemplates() implementation rather than adding search-index
 * complexity the scale doesn't need. */
export default function TemplateLibraryPanel({ onEdit, pushToast }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/broadcasts/templates", { headers: adminAuthHeaders() });
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message || "Could not load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allTags = useMemo(() => {
    const set = new Set();
    templates.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return [...set].sort();
  }, [templates]);

  const filtered = templates.filter((t) => {
    const matchesSearch = !searchText || t.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = !typeFilter || t.type === typeFilter;
    const matchesTag = !tagFilter || (t.tags || []).includes(tagFilter);
    return matchesSearch && matchesType && matchesTag;
  });

  async function handlePreview(template) {
    try {
      const data = await apiFetch(`/api/admin/broadcasts/templates/${template.id}`, { headers: adminAuthHeaders() });
      setPreviewTemplate(data.template);
    } catch (err) {
      pushToast?.({ type: "error", message: err.message || "Could not load template." });
    }
  }

  async function handleEdit(template) {
    try {
      const data = await apiFetch(`/api/admin/broadcasts/templates/${template.id}`, { headers: adminAuthHeaders() });
      onEdit?.(data.template);
    } catch (err) {
      pushToast?.({ type: "error", message: err.message || "Could not load template." });
    }
  }

  async function handleDuplicate(template) {
    try {
      await apiFetch(`/api/admin/broadcasts/templates/${template.id}/duplicate`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      pushToast?.({ type: "success", message: "Template duplicated." });
      await load();
    } catch (err) {
      pushToast?.({ type: "error", message: err.message || "Could not duplicate template." });
    }
  }

  async function handleDelete(template) {
    if (!window.confirm(`Delete "${template.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/broadcasts/templates/${template.id}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      pushToast?.({ type: "success", message: "Template deleted." });
      await load();
    } catch (err) {
      pushToast?.({ type: "error", message: err.message || "Could not delete template." });
    }
  }

  function handleUseForBroadcast(template) {
    navigate(`/admin/communication?templateId=${template.id}`);
  }

  return (
    <div className="admin-templates__library">
      <div className="admin-templates__library-toolbar">
        <input
          className="admin-templates__search"
          placeholder="Search by name…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">All tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {error ? <p className="admin-templates__error">{error}</p> : null}

      {loading ? (
        <p className="admin-templates__status">Loading templates…</p>
      ) : filtered.length === 0 ? (
        <p className="admin-templates__status">No templates match your filters.</p>
      ) : (
        <div className="admin-templates__library-table-wrap">
          <table className="admin-templates__library-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Created</th>
                <th>Tags</th>
                <th>Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((template) => (
                <tr key={template.id}>
                  <td>
                    <strong>{template.name}</strong>
                    {template.isSystem ? <span className="admin-templates__badge">System</span> : null}
                  </td>
                  <td>{TYPE_LABELS[template.type] || template.type}</td>
                  <td>{formatDate(template.createdAt)}</td>
                  <td>
                    {(template.tags || []).map((tag) => (
                      <span key={tag} className="admin-templates__tag-chip">{tag}</span>
                    ))}
                  </td>
                  <td>{template.usageCount || 0}</td>
                  <td className="admin-templates__library-actions">
                    <button type="button" aria-label="Preview" onClick={() => handlePreview(template)}>
                      <IconEye size={16} />
                    </button>
                    <button type="button" aria-label="Edit" onClick={() => handleEdit(template)}>
                      <IconEdit size={16} />
                    </button>
                    <button type="button" aria-label="Duplicate" onClick={() => handleDuplicate(template)}>
                      <IconCopy size={16} />
                    </button>
                    {!template.isSystem ? (
                      <button type="button" aria-label="Delete" onClick={() => handleDelete(template)}>
                        <IconTrash size={16} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="admin-templates__use-broadcast-btn"
                      onClick={() => handleUseForBroadcast(template)}
                    >
                      <IconSend size={14} /> Use for Broadcast
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewTemplate ? (
        <div className="admin-broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="preview-template-title">
          <div className="admin-broadcast-modal__panel admin-broadcast-modal__panel--wide">
            <div className="admin-broadcast-modal__head">
              <h2 id="preview-template-title">{previewTemplate.name}</h2>
              <button type="button" onClick={() => setPreviewTemplate(null)} aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <div className="admin-broadcast-modal__body">
              <TemplatePreviewEditor html={previewTemplate.htmlBody} readOnly />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
