import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch, authHeaders } from "../utils/api.js";
import { useAuth } from "./AuthContext.jsx";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [wallet, setWallet] = useState(null); // { enabled, balanceMinor, rewardPoints, lowBalance, settings, pointsProgram }
  const [transactions, setTransactions] = useState([]);
  const [aiBookings, setAiBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch("/api/wallet", { headers: authHeaders() });
      setWallet(data);
    } catch (err) {
      setError(err.message || "Could not load your wallet.");
    }
  }, [isAuthenticated]);

  const loadTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch("/api/wallet/transactions", { headers: authHeaders() });
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message || "Could not load transaction history.");
    }
  }, [isAuthenticated]);

  const loadAiBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiFetch("/api/wallet/ai-bookings", { headers: authHeaders() });
      setAiBookings(data.bookings || []);
    } catch {
      // non-fatal
    }
  }, [isAuthenticated]);

  const startTopUp = useCallback(async ({ amountMinor, otp, clientRequestId }) => {
    return apiFetch("/api/wallet/topup", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ amountMinor, otp, clientRequestId }),
    });
  }, []);

  const previewRedeemPoints = useCallback(async (points) => {
    return apiFetch("/api/wallet/redeem-points", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ points }),
    });
  }, []);

  const payWithWallet = useCallback(
    async ({ eventId, checkout, pointsToRedeem, split }) => {
      setLoading(true);
      try {
        const result = await apiFetch("/api/wallet/pay", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ eventId, checkout, pointsToRedeem, split }),
        });
        await loadWallet();
        return result;
      } finally {
        setLoading(false);
      }
    },
    [loadWallet]
  );

  const updateSettings = useCallback(
    async (updates) => {
      const data = await apiFetch("/api/wallet/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      setWallet((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...updates } } : prev));
      return data.settings;
    },
    []
  );

  const revokeAiBooking = useCallback(async () => {
    await apiFetch("/api/wallet/ai-booking/revoke", { method: "POST", headers: authHeaders() });
    setWallet((prev) => (prev ? { ...prev, settings: { ...prev.settings, aiBookingEnabled: false } } : prev));
  }, []);

  const value = useMemo(
    () => ({
      wallet,
      transactions,
      aiBookings,
      error,
      setError,
      loading,
      loadWallet,
      loadTransactions,
      loadAiBookings,
      startTopUp,
      previewRedeemPoints,
      payWithWallet,
      updateSettings,
      revokeAiBooking,
    }),
    [
      wallet, transactions, aiBookings, error, loading,
      loadWallet, loadTransactions, loadAiBookings, startTopUp, previewRedeemPoints, payWithWallet, updateSettings, revokeAiBooking,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
