import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  adminAuthHeaders,
  apiFetch,
  getStoredAdminToken,
  setStoredAdminToken,
} from "../utils/api.js";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setStoredAdminToken(null);
    setAdmin(null);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const token = getStoredAdminToken();
    if (!token) {
      setAdmin(null);
      return null;
    }

    try {
      const data = await apiFetch("/api/admin/me", { headers: adminAuthHeaders() });
      setAdmin(data.admin);
      return data.admin;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await refreshAdmin();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshAdmin]);

  const loginWithAdminToken = useCallback(
    async (token, nextAdmin, rememberMe = true) => {
      setStoredAdminToken(token, rememberMe);
      setAdmin(nextAdmin);
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      admin,
      loading,
      isAdminAuthenticated: Boolean(admin),
      loginWithAdminToken,
      logout,
      refreshAdmin,
    }),
    [admin, loading, loginWithAdminToken, logout, refreshAdmin]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
