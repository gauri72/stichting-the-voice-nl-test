import { NavLink, Outlet } from "react-router-dom";
import { IconSettings } from "@tabler/icons-react";
import AdminLayout from "../AdminLayout.jsx";
import { useAdminAuth } from "../../../contexts/AdminAuthContext.jsx";
import { canReadSettingsCategory, SETTINGS_NAV } from "../../../utils/settingsAdmin.js";
import "../../../styles/admin-settings.css";

export default function AdminSettingsLayout() {
  const { admin } = useAdminAuth();
  const role = admin?.role || "viewer";

  const items = SETTINGS_NAV.filter((item) => {
    if (item.audit) return canReadSettingsCategory(role, "security");
    if (item.templates) return canReadSettingsCategory(role, "pdf_templates");
    if (item.finance) return canReadSettingsCategory(role, item.category);
    return canReadSettingsCategory(role, item.category || "general");
  });

  return (
    <AdminLayout pageTitle="Settings" pageSubtitle="Manage backend operational configuration" hideBottomNav>
      <div className="admin-settings">
        <aside className="admin-settings__nav" aria-label="Settings sections">
          <h2 className="admin-settings__nav-title">
            <IconSettings size={18} /> Settings
          </h2>
          <nav>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `admin-settings__nav-link${isActive ? " admin-settings__nav-link--active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="admin-settings__content">
          <Outlet />
        </main>
      </div>
    </AdminLayout>
  );
}
