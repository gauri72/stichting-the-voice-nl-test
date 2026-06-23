import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconLayoutDashboard, IconSettings } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import DashboardWidgetRenderer from "./dashboard/DashboardWidgetRenderer.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import { hasDashboardPermission } from "../../utils/dashboardAdmin.js";
import "../../styles/admin-dashboard-page.css";
import "../../styles/admin-dashboard-builder.css";

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const canEdit = hasDashboardPermission(admin?.role, "dashboard.write");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/admin/dashboard", { headers: adminAuthHeaders() });
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const dashboard = payload?.dashboard;
  const settings = dashboard?.settings || {};
  const pageTitle = settings.title || "Dashboard";
  const pageSubtitle = settings.subtitle || "Overview of users, memberships, and activity.";

  return (
    <AdminLayout pageTitle={pageTitle} pageSubtitle={pageSubtitle}>
      <div className="admin-dashboard-main">
        {canEdit ? (
          <div className="admin-dashboard-toolbar">
            <Link to="/admin/dashboard-builder" className="admin-dashboard-toolbar__btn">
              <IconSettings size={16} /> Dashboard Builder
            </Link>
          </div>
        ) : null}

        {loading ? <p className="admin-dashboard-status" role="status">Loading dashboard data…</p> : null}
        {error ? <p className="admin-dashboard-error" role="alert">{error}</p> : null}

        {dashboard?.widgets?.length ? (
          <DashboardWidgetRenderer widgets={dashboard.widgets} settings={settings} />
        ) : !loading && !error ? (
          <div className="admin-dashboard-empty">
            <IconLayoutDashboard size={40} stroke={1.25} />
            <p>No dashboard layout published yet.</p>
            {canEdit ? (
              <Link to="/admin/dashboard-builder" className="admin-dashboard-toolbar__btn admin-dashboard-toolbar__btn--primary">
                Open Dashboard Builder
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
