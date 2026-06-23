import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import CustomerDashboardRenderer from "../dashboard/CustomerDashboardRenderer.jsx";
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-cms-page.css";
import "../../styles/admin-customer-dashboard-builder.css";
import "../../styles/dashboard-shared.css";
import "../../styles/dashboard-desktop.css";
import "../../styles/dashboard-mobile.css";

export default function AdminCustomerDashboardPreviewPage() {
  const { admin } = useAdminAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/customer-dashboard/preview", { headers: adminAuthHeaders() });
      setConfig(data);
    } catch (err) {
      setError(err.message || "Could not load preview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const previewData = {
    profile: { fullName: admin?.firstName || "Preview User", email: admin?.email },
    overview: { events: { value: "3" }, donations: { value: "€50" }, sponsorships: { count: 1 } },
    activity: [],
    membership: null,
  };

  return (
    <AdminLayout pageTitle="Dashboard Preview" hideBottomNav>
      <div className="admin-cms admin-cms--customer-dashboard admin-cms--preview-only">
        <header className="admin-cms__toolbar">
          <Link to="/admin/customer-dashboard-builder" className="admin-cms__back">
            <IconArrowLeft size={18} /> Back to builder
          </Link>
          <span className="admin-cms__badge admin-cms__badge--draft">Draft preview</span>
        </header>

        {loading ? <p className="admin-cms__loading">Loading preview…</p> : null}
        {error ? <p className="admin-cms__error" role="alert">{error}</p> : null}

        {config ? (
          <div className="member-dashboard-viewport">
            <CustomerDashboardRenderer
              config={config}
              data={previewData}
              displayName={admin?.firstName || "Preview User"}
              preview
            />
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
