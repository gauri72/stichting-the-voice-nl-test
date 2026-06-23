import { useMemo } from "react";
import { useAdminAuth } from "../contexts/AdminAuthContext.jsx";
import { canAccessEvent, hasAnyPermission, hasPermission } from "../utils/rbacAdmin.js";

export function useCurrentAdmin() {
  const { admin, loading, isAdminAuthenticated } = useAdminAuth();
  return { admin, loading, isAuthenticated: isAdminAuthenticated };
}

export function usePermissions() {
  const { admin } = useAdminAuth();
  const permissions = admin?.permissions || [];

  return useMemo(
    () => ({
      permissions,
      can: (permission) => hasPermission(permissions, permission),
      canAny: (list) => hasAnyPermission(permissions, list),
      canAccessEvent: (eventId) => canAccessEvent(admin, eventId),
      isSuperAdmin: permissions.includes("*") || admin?.role === "superadmin",
    }),
    [admin, permissions]
  );
}

export default usePermissions;
