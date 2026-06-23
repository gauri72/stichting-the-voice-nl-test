import { NavLink, Outlet } from "react-router-dom";
import AdminLayout from "../AdminLayout.jsx";
import "../../../styles/admin-access-management.css";

const SUBMENU = [
  { to: "/admin/access-management/team", label: "Team Members" },
  { to: "/admin/access-management/roles", label: "Roles" },
  { to: "/admin/access-management/permissions", label: "Permissions" },
  { to: "/admin/access-management/invitations", label: "Invitations" },
  { to: "/admin/access-management/audit", label: "Audit Logs" },
  { to: "/admin/access-management/settings", label: "Access Settings" },
];

export default function AccessManagementLayout() {
  return (
    <AdminLayout pageTitle="Access Management" pageSubtitle="Roles, permissions, team access and audit">
      <div className="admin-access__layout">
        <nav className="admin-access__nav" aria-label="Access management sections">
          {SUBMENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-access__content">
          <Outlet />
        </div>
      </div>
    </AdminLayout>
  );
}
