import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getWholesalerStatus } from "../components/vcommerce/shared/vcommerceApi.js";

const WholesalerContext = createContext(null);

export function WholesalerProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null); // null = not loaded; { registered, status, companyName }
  const [loaded, setLoaded] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(null);
      setLoaded(true);
      return;
    }
    try {
      const data = await getWholesalerStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const isApprovedWholesaler = status?.registered && status?.status === "approved";

  const value = useMemo(
    () => ({ status, loaded, isApprovedWholesaler, loadStatus }),
    [status, loaded, isApprovedWholesaler, loadStatus]
  );

  return <WholesalerContext.Provider value={value}>{children}</WholesalerContext.Provider>;
}

export function useWholesaler() {
  const context = useContext(WholesalerContext);
  if (!context) {
    throw new Error("useWholesaler must be used within WholesalerProvider");
  }
  return context;
}
