import { useEffect, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import usePermissions from "../../../hooks/usePermissions.js";

export default function AccessSettingsPage() {
  const { can } = usePermissions();
  const canEdit = can("access_management.edit");
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/access/settings", { headers: adminAuthHeaders() })
      .then((data) => setSettings(data.settings))
      .catch(() => setSettings({ inviteExpiryDays: 7 }));
  }, []);

  async function save() {
    if (!canEdit) return;
    try {
      const data = await apiFetch("/api/admin/access/settings", {
        method: "PATCH",
        headers: adminAuthHeaders(),
        body: JSON.stringify(settings),
      });
      setSettings(data.settings);
      setMessage("Settings saved.");
    } catch (err) {
      setMessage(err.message || "Save failed.");
    }
  }

  if (!settings) return <p className="admin-events__hint">Loading settings…</p>;

  return (
    <section className="admin-events__card">
      <h3>Access Settings</h3>
      <div className="admin-events__form-grid">
        <label>
          Invitation expiry (days)
          <input
            type="number"
            min={1}
            max={30}
            value={settings.inviteExpiryDays}
            onChange={(e) => setSettings((s) => ({ ...s, inviteExpiryDays: Number(e.target.value) }))}
            disabled={!canEdit}
          />
        </label>
        <label>
          Organization name
          <input value={settings.organizationName || ""} readOnly />
        </label>
      </div>
      {message ? <p className="admin-events__hint">{message}</p> : null}
      {canEdit ? (
        <div className="admin-access__sticky-save">
          <button type="button" onClick={save}>Save settings</button>
        </div>
      ) : null}
    </section>
  );
}
