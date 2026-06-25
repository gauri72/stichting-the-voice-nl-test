import { useState } from "react";
import { IconSparkles } from "@tabler/icons-react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";

const ACTION_LABELS = {
  rewrite: "Rewrite",
  shorten: "Shorten",
  expand: "Expand",
  improve_seo: "Improve for SEO",
  generate_cta: "Suggest CTA",
  generate_alt_text: "Suggest alt text",
  generate_meta_description: "Suggest meta description",
  make_mobile_friendly: "Make mobile-friendly",
};

let statusCache = null;
async function getStatus() {
  if (statusCache) return statusCache;
  statusCache = await apiFetch("/api/admin/ai-assistant/status", { headers: adminAuthHeaders() }).catch(() => ({ configured: false }));
  return statusCache;
}

export default function AiAssistantButton({ text, actions = ["rewrite", "shorten", "expand"], onApply, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");

  async function toggleOpen() {
    if (!open && configured === null) {
      const status = await getStatus();
      setConfigured(status.configured);
    }
    setOpen((v) => !v);
    setSuggestion(null);
    setError("");
  }

  async function runAction(action) {
    setLoadingAction(action);
    setError("");
    try {
      const result = await apiFetch("/api/admin/ai-assistant/run", {
        method: "POST",
        headers: adminAuthHeaders(),
        body: JSON.stringify({ action, text }),
      });
      setSuggestion(result.suggestion);
    } catch (err) {
      setError(err.message || "AI assistant failed.");
    } finally {
      setLoadingAction(null);
    }
  }

  function apply() {
    onApply(suggestion);
    setSuggestion(null);
    setOpen(false);
  }

  if (disabled) return null;

  return (
    <span className="admin-cms__ai-assistant">
      <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={toggleOpen} title="AI assistant">
        <IconSparkles size={14} />
      </button>
      {open ? (
        <div className="admin-cms__ai-popover">
          {configured === false ? (
            <p className="admin-cms__empty">AI assistant not configured.</p>
          ) : (
            <>
              <div className="admin-cms__ai-actions">
                {actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="admin-cms__btn admin-cms__btn--sm"
                    onClick={() => runAction(action)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === action ? "Thinking…" : ACTION_LABELS[action] || action}
                  </button>
                ))}
              </div>
              {error ? <p className="admin-cms__error" style={{ fontSize: 12 }}>{error}</p> : null}
              {suggestion ? (
                <div className="admin-cms__ai-suggestion">
                  <p>{suggestion}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="admin-cms__btn admin-cms__btn--sm admin-cms__btn--primary" onClick={apply}>Apply</button>
                    <button type="button" className="admin-cms__btn admin-cms__btn--sm" onClick={() => setSuggestion(null)}>Discard</button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </span>
  );
}
