import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconDeviceFloppy, IconRocket } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { canPublishPages, canWritePages } from "../../utils/pagesAdmin.js";
import "../../styles/admin-cms-page.css";

const COLOR_KEYS = ["primary", "secondary", "accent", "success", "warning", "error"];
const BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost"];
const SPACING_KEYS = ["xs", "sm", "md", "lg", "xl"];
const RADIUS_KEYS = ["sm", "md", "lg", "full"];

function ColorField({ label, value, onChange, disabled }) {
  return (
    <div className="admin-cms__field-row">
      <label className="admin-cms__label">{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ width: 44, height: 32, padding: 0, border: "none", background: "none" }} />
        <input className="admin-cms__input" value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ maxWidth: 120 }} />
      </div>
    </div>
  );
}

export default function AdminDesignSystemPage() {
  const { admin } = useAdminAuth();
  const readOnly = !canWritePages(admin?.role);
  const canPublish = canPublishPages(admin?.role);
  const [draft, setDraft] = useState(null);
  const [allowedFonts, setAllowedFonts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/design-system", { headers: adminAuthHeaders() });
      setDraft(data.draft || {});
      setAllowedFonts(data.allowedFontFamilies || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setColor(key, value) {
    setDraft((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  }
  function setTypography(field, value) {
    setDraft((prev) => ({ ...prev, typography: { ...prev.typography, [field]: value } }));
  }
  function setButton(variant, prop, value) {
    setDraft((prev) => ({
      ...prev,
      buttons: { ...prev.buttons, [variant]: { ...prev.buttons?.[variant], [prop]: value } },
    }));
  }
  function setLayoutScale(group, key, value) {
    setDraft((prev) => ({
      ...prev,
      layout: { ...prev.layout, [group]: { ...prev.layout?.[group], [key]: value } },
    }));
  }

  async function save(publish = false) {
    setSaving(true);
    try {
      if (publish) {
        await apiFetch("/api/admin/design-system", { method: "PUT", headers: adminAuthHeaders(), body: JSON.stringify(draft) });
        await apiFetch("/api/admin/design-system/publish", { method: "POST", headers: adminAuthHeaders() });
      } else {
        await apiFetch("/api/admin/design-system", { method: "PUT", headers: adminAuthHeaders(), body: JSON.stringify(draft) });
      }
      setMessage(publish ? "Design system published." : "Draft saved.");
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout pageTitle="Design System" pageSubtitle="Site-wide colors, fonts, buttons and spacing tokens." hideBottomNav>
      <div className="admin-cms admin-cms--editor">
        <div className="admin-cms__editor-topbar">
          <Link to="/admin/cms" className="admin-cms__back"><IconArrowLeft size={18} /> CMS</Link>
          {!readOnly ? (
            <div className="admin-cms__editor-actions">
              <button type="button" className="admin-cms__btn admin-cms__btn--outline" onClick={() => save(false)} disabled={saving}>
                <IconDeviceFloppy size={16} /> Save draft
              </button>
              {canPublish ? (
                <button type="button" className="admin-cms__btn admin-cms__btn--primary" onClick={() => save(true)} disabled={saving}>
                  <IconRocket size={16} /> Publish
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="admin-cms__status" style={{ fontSize: 13 }}>
          These tokens are published as CSS variables (e.g. <code>--voice-color-primary</code>) site-wide. Existing
          pages keep their current look until a component opts in to using them.
        </p>
        {message ? <p className="admin-cms__success">{message}</p> : null}
        {loading ? <p className="admin-cms__status">Loading…</p> : null}
        {draft ? (
          <div className="admin-cms__single-editor">
            <h3>Colors</h3>
            {COLOR_KEYS.map((key) => (
              <ColorField key={key} label={key} value={draft.colors?.[key]} onChange={(v) => setColor(key, v)} disabled={readOnly} />
            ))}

            <h3>Typography</h3>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Heading font</label>
              <select className="admin-cms__input" value={draft.typography?.headingFont || ""} onChange={(e) => setTypography("headingFont", e.target.value)} disabled={readOnly}>
                {allowedFonts.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="admin-cms__field-row">
              <label className="admin-cms__label">Body font</label>
              <select className="admin-cms__input" value={draft.typography?.bodyFont || ""} onChange={(e) => setTypography("bodyFont", e.target.value)} disabled={readOnly}>
                {allowedFonts.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <p style={{ fontFamily: `"${draft.typography?.headingFont}"`, fontSize: 22, margin: "8px 0" }}>
              Heading preview — Stichting The V.O.I.C.E. NL
            </p>
            <p style={{ fontFamily: `"${draft.typography?.bodyFont}"`, margin: "0 0 16px" }}>
              Body text preview — the quick brown fox jumps over the lazy dog.
            </p>

            <h3>Buttons</h3>
            {BUTTON_VARIANTS.map((variant) => (
              <div key={variant} className="admin-cms__field-row" style={{ alignItems: "center" }}>
                <label className="admin-cms__label" style={{ textTransform: "capitalize" }}>{variant}</label>
                <button
                  type="button"
                  disabled
                  style={{
                    background: draft.buttons?.[variant]?.background,
                    color: draft.buttons?.[variant]?.text,
                    border: `1px solid ${draft.buttons?.[variant]?.border || "transparent"}`,
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "default",
                  }}
                >
                  {variant} button
                </button>
                {["background", "text", "border"].map((prop) => (
                  <input
                    key={prop}
                    type="color"
                    value={draft.buttons?.[variant]?.[prop] === "transparent" ? "#ffffff" : draft.buttons?.[variant]?.[prop] || "#ffffff"}
                    onChange={(e) => setButton(variant, prop, e.target.value)}
                    disabled={readOnly}
                    title={prop}
                    style={{ width: 32, height: 28, padding: 0, border: "none" }}
                  />
                ))}
              </div>
            ))}

            <h3>Spacing scale</h3>
            <div className="admin-cms__field-row">
              {SPACING_KEYS.map((key) => (
                <div key={key} style={{ marginRight: 12 }}>
                  <label className="admin-cms__label">{key}</label>
                  <input className="admin-cms__input" value={draft.layout?.spacing?.[key] || ""} onChange={(e) => setLayoutScale("spacing", key, e.target.value)} disabled={readOnly} style={{ width: 64 }} />
                </div>
              ))}
            </div>

            <h3>Border radius scale</h3>
            <div className="admin-cms__field-row">
              {RADIUS_KEYS.map((key) => (
                <div key={key} style={{ marginRight: 12 }}>
                  <label className="admin-cms__label">{key}</label>
                  <input className="admin-cms__input" value={draft.layout?.borderRadius?.[key] || ""} onChange={(e) => setLayoutScale("borderRadius", key, e.target.value)} disabled={readOnly} style={{ width: 64 }} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
