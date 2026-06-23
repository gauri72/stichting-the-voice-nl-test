import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminAuthHeaders, apiFetch } from "../../../utils/api.js";
import { formatDate, formatTemplateType } from "../../../utils/settingsAdmin.js";

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/settings/email-templates", { headers: adminAuthHeaders() })
      .then((d) => setTemplates(d.templates || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-settings__panel">
      <header className="admin-settings__panel-header">
        <h1>Email Templates</h1>
        <p>Operational emails for memberships, tickets, sponsorships, donations and invoices.</p>
      </header>

      {loading ? <p>Loading…</p> : null}
      {error ? <p className="admin-settings__error" role="alert">{error}</p> : null}

      <div className="admin-settings__table-wrap">
        <table className="admin-settings__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.map((tpl) => (
              <tr key={tpl.templateId || tpl._id}>
                <td>{tpl.name}</td>
                <td>{formatTemplateType(tpl.templateType)}</td>
                <td><span className={`admin-settings__badge admin-settings__badge--${tpl.status}`}>{tpl.status}</span></td>
                <td>{formatDate(tpl.updatedAt)}</td>
                <td>
                  <Link to={`/admin/settings/email-templates/${tpl.templateId || tpl._id}`} className="admin-settings__link">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
