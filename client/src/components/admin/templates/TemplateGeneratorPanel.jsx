import { useEffect, useState } from "react";
import { IconSparkles, IconCopy, IconDeviceFloppy, IconX } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import TemplatePreviewEditor from "./TemplatePreviewEditor.jsx";

const TEMPLATE_TYPES = [
  { value: "newsletter", label: "Newsletter" },
  { value: "event_announcement", label: "Event Announcement" },
  { value: "promotional", label: "Promotional" },
  { value: "transactional", label: "Transactional" },
  { value: "welcome_email", label: "Welcome Email" },
];

const COLOR_SCHEMES = [
  { value: "default", label: "Default" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "brand", label: "Brand Colors" },
];

const EMPTY_SAVE_FORM = { name: "", tags: "" };

/**
 * Generate + split preview/editor + Regenerate/Copy/Save. Also doubles as the edit screen
 * for an existing template (Library's "Edit" action passes `editingTemplate`) — the same
 * generate/regenerate/save controls work whether the HTML on screen came from a fresh AI
 * call or from a saved template, since "Save" just POSTs (new) or PUTs (existing) whatever
 * is currently in `html`.
 */
export default function TemplateGeneratorPanel({ editingTemplate, onSaved, pushToast }) {
  const [promptText, setPromptText] = useState("");
  const [templateType, setTemplateType] = useState("newsletter");
  const [colorScheme, setColorScheme] = useState("default");
  const [html, setHtml] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveForm, setSaveForm] = useState(EMPTY_SAVE_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!editingTemplate) return;
    setEditingTemplateId(editingTemplate.id);
    setHtml(editingTemplate.htmlBody || "");
    setTemplateType(editingTemplate.type || "newsletter");
    setColorScheme(editingTemplate.colorScheme || "default");
    setPromptText(editingTemplate.aiPrompt || "");
  }, [editingTemplate]);

  async function runGenerate() {
    if (!promptText.trim()) {
      setGenerateError("Describe the template you want first.");
      return;
    }
    setGenerating(true);
    setGenerateError("");
    try {
      const data = await apiFetch("/api/admin/broadcasts/templates/generate", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ prompt: promptText, templateType, colorScheme }),
      });
      setHtml(data.html);
    } catch (err) {
      setGenerateError(err.message || "Could not generate a template. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  // "Regenerate" is the exact same call as "Generate" — the backend has no separate
  // regenerate concept, it's just "generate again" with whatever is currently in the form.
  // Kept as a distinct handler only so the two buttons can have different labels/positions.
  const runRegenerate = runGenerate;

  async function handleCopyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      pushToast?.({ type: "success", message: "HTML copied to clipboard." });
    } catch {
      pushToast?.({ type: "error", message: "Could not copy to clipboard." });
    }
  }

  function openSaveModal() {
    setSaveForm({
      name: editingTemplate?.name || "",
      tags: (editingTemplate?.tags || []).join(", "),
    });
    setSaveError("");
    setSaveModalOpen(true);
  }

  async function handleSaveSubmit(e) {
    e.preventDefault();
    if (!saveForm.name.trim()) {
      setSaveError("Template name is required.");
      return;
    }
    if (!html.trim()) {
      setSaveError("Generate or write some HTML before saving.");
      return;
    }

    setSaving(true);
    setSaveError("");
    const tags = saveForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      name: saveForm.name.trim(),
      subject: saveForm.name.trim(),
      htmlBody: html,
      type: templateType,
      tags,
      colorScheme,
      aiGenerated: Boolean(promptText.trim()),
      aiPrompt: promptText,
    };

    try {
      if (editingTemplateId) {
        await apiFetch(`/api/admin/broadcasts/templates/${editingTemplateId}`, {
          method: "PUT",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
        pushToast?.({ type: "success", message: "Template updated." });
      } else {
        await apiFetch("/api/admin/broadcasts/templates", {
          method: "POST",
          headers: adminAuthHeaders(),
          body: JSON.stringify(payload),
        });
        pushToast?.({ type: "success", message: "Template saved." });
      }
      setSaveModalOpen(false);
      onSaved?.();
    } catch (err) {
      setSaveError(err.message || "Could not save the template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-templates__generator">
      <div className="admin-templates__prompt-row">
        <label className="admin-templates__field admin-templates__field--prompt">
          <span>Describe the template you want</span>
          <textarea
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder='e.g. "Create a summer event newsletter with a hero banner, event details section and a register now button"'
          />
        </label>
        <div className="admin-templates__prompt-controls">
          <label className="admin-templates__field">
            <span>Template type</span>
            <select value={templateType} onChange={(e) => setTemplateType(e.target.value)}>
              {TEMPLATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="admin-templates__field">
            <span>Color scheme</span>
            <select value={colorScheme} onChange={(e) => setColorScheme(e.target.value)}>
              {COLOR_SCHEMES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="admin-broadcast__primary-btn"
            onClick={html ? runRegenerate : runGenerate}
            disabled={generating}
          >
            <IconSparkles size={16} />
            {generating ? "Generating…" : html ? "Regenerate" : "Generate Template"}
          </button>
        </div>
      </div>

      {generateError ? <p className="admin-templates__error">{generateError}</p> : null}

      {generating ? (
        <div className="admin-templates__skeleton" aria-label="Generating template…">
          <div className="admin-templates__skeleton-pane" />
          <div className="admin-templates__skeleton-pane" />
        </div>
      ) : html ? (
        <>
          <TemplatePreviewEditor html={html} onHtmlChange={setHtml} />
          <div className="admin-templates__editor-actions">
            <button type="button" className="admin-broadcast__ghost-btn" onClick={handleCopyHtml}>
              <IconCopy size={16} /> Copy HTML
            </button>
            <button type="button" className="admin-broadcast__primary-btn" onClick={openSaveModal}>
              <IconDeviceFloppy size={16} /> Save Template
            </button>
          </div>
        </>
      ) : null}

      {saveModalOpen ? (
        <div className="admin-broadcast-modal" role="dialog" aria-modal="true" aria-labelledby="save-template-title">
          <div className="admin-broadcast-modal__panel">
            <div className="admin-broadcast-modal__head">
              <h2 id="save-template-title">{editingTemplateId ? "Update Template" : "Save Template"}</h2>
              <button type="button" onClick={() => setSaveModalOpen(false)} aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <form className="admin-broadcast-modal__body" onSubmit={handleSaveSubmit}>
              <label>
                Template name
                <input
                  value={saveForm.name}
                  onChange={(e) => setSaveForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                Template type
                <input value={TEMPLATE_TYPES.find((t) => t.value === templateType)?.label || templateType} disabled readOnly />
              </label>
              <label>
                Tags (comma-separated)
                <input
                  value={saveForm.tags}
                  onChange={(e) => setSaveForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="summer, sale, members"
                />
              </label>
              {saveError ? <p className="admin-templates__error">{saveError}</p> : null}
              <div className="admin-broadcast-modal__actions">
                <button type="button" className="admin-broadcast__ghost-btn" onClick={() => setSaveModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-broadcast__primary-btn" disabled={saving}>
                  {saving ? "Saving…" : editingTemplateId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
