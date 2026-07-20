import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import {
  listPendingTranslations,
  approveTranslation,
  rejectTranslation,
} from "./i18nReview/i18nReviewApi.js";

const S = {
  card: { background: "var(--ad-card-bg,var(--color-card-bg,#fff))", borderRadius: 12, border: "1px solid var(--ad-border,rgba(128,128,128,0.15))", padding: 20, marginBottom: 16 },
  label: { fontSize: "0.78rem", fontWeight: 600, color: "var(--ad-text-muted,#888)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 },
  meta: { fontSize: "0.8rem", color: "var(--ad-text-muted,#888)", marginBottom: 12 },
  englishBlock: { fontSize: "0.9rem", padding: "10px 12px", background: "var(--ad-bg,rgba(128,128,128,0.06))", borderRadius: 8, marginBottom: 14 },
  textarea: { width: "100%", minHeight: 70, padding: "8px 12px", border: "1px solid var(--ad-border,rgba(128,128,128,0.3))", borderRadius: 8, background: "var(--ad-bg,#fff)", color: "inherit", fontSize: "0.9rem", fontFamily: "inherit", resize: "vertical" },
  row: { display: "flex", gap: 10, marginTop: 14 },
  btn: (variant) => ({
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    border: variant === "reject" ? "1px solid rgba(239,68,68,0.4)" : "none",
    background: variant === "approve" ? "var(--ad-accent,#8B5CF6)" : "transparent",
    color: variant === "approve" ? "#fff" : variant === "reject" ? "#DC2626" : "inherit",
  }),
  empty: { textAlign: "center", padding: "48px 20px", color: "var(--ad-text-muted,#888)" },
};

export default function AdminI18nReviewPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edits, setEdits] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPendingTranslations();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load pending translations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(item) {
    setBusyId(item._id);
    try {
      await approveTranslation(item._id, edits[item._id]);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      setError(err.message || "Failed to approve translation.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(item) {
    setBusyId(item._id);
    try {
      await rejectTranslation(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      setError(err.message || "Failed to reject translation.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout pageTitle="Translation Review" pageSubtitle="Review, edit, approve, or reject translations the automated i18n pipeline generated">
      {error && <div style={{ ...S.card, borderColor: "rgba(239,68,68,0.4)", color: "#DC2626" }}>{error}</div>}

      {loading ? (
        <div style={S.empty}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={S.empty}>No pending translations. Everything's been reviewed.</div>
      ) : (
        items.map((item) => (
          <div key={item._id} style={S.card}>
            <div style={S.label}>{item.namespace}.{item.key} — {item.lang.toUpperCase()}</div>
            <div style={S.meta}>Generated {new Date(item.createdAt).toLocaleString("nl-NL")}{item.commitSha ? ` · commit ${item.commitSha.slice(0, 7)}` : ""}</div>
            <div style={S.englishBlock}>{item.englishText}</div>
            <textarea
              style={S.textarea}
              value={edits[item._id] ?? item.translatedText}
              onChange={(e) => setEdits((prev) => ({ ...prev, [item._id]: e.target.value }))}
            />
            <div style={S.row}>
              <button type="button" style={S.btn("approve")} disabled={busyId === item._id} onClick={() => handleApprove(item)}>
                Approve
              </button>
              <button type="button" style={S.btn("reject")} disabled={busyId === item._id} onClick={() => handleReject(item)}>
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </AdminLayout>
  );
}
