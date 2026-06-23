import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "hidden"];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString();
      const data = await apiFetch(`/api/admin/reviews${query ? `?${query}` : ""}`, {
        headers: adminAuthHeaders(),
      });
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err.message || "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = window.setTimeout(loadReviews, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews, search]);

  async function runAction(id, path, method = "POST", body = null) {
    setSavingId(id);
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/admin/reviews/${id}/${path}`, {
        method,
        headers: adminAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      setMessage("Review updated.");
      await loadReviews();
      window.setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteReview(id) {
    setSavingId(id);
    setError("");
    try {
      await apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE", headers: adminAuthHeaders() });
      setMessage("Review deleted.");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <AdminLayout pageTitle="Community Reviews" pageSubtitle="Moderate, feature and manage public testimonials">
      <section className="admin-events__card">
        <div className="admin-events__form-grid">
          <label>
            Search
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, review, event…" />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? <p className="admin-events__hint">Loading reviews…</p> : null}
      {error ? <p className="admin-events__error" role="alert">{error}</p> : null}
      {message ? <p className="admin-events__hint">{message}</p> : null}

      <section className="admin-events__card">
        <table className="admin-tickets__table">
          <thead>
            <tr>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Event</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>{r.name}{r.featured ? " ★" : ""}</td>
                <td>{r.rating}/5</td>
                <td>{r.quote?.slice(0, 90)}{r.quote?.length > 90 ? "…" : ""}</td>
                <td>{r.eventName || "—"}</td>
                <td>{r.status}</td>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                <td>
                  <div className="admin-events__form-actions">
                    {r.status !== "approved" ? (
                      <button type="button" disabled={savingId === r.id} onClick={() => runAction(r.id, "approve")}>Approve</button>
                    ) : null}
                    {r.status !== "rejected" ? (
                      <button type="button" disabled={savingId === r.id} onClick={() => runAction(r.id, "reject")}>Reject</button>
                    ) : null}
                    {r.status !== "hidden" ? (
                      <button type="button" disabled={savingId === r.id} onClick={() => runAction(r.id, "hide")}>Hide</button>
                    ) : null}
                    <button
                      type="button"
                      disabled={savingId === r.id}
                      onClick={() => runAction(r.id, "feature", "POST", { featured: !r.featured })}
                    >
                      {r.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button type="button" disabled={savingId === r.id} onClick={() => deleteReview(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !reviews.length ? <p className="admin-events__hint">No reviews found.</p> : null}
      </section>
    </AdminLayout>
  );
}
