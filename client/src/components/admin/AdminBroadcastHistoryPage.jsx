import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import BroadcastPdfDownloadButton from "./BroadcastPdfDownloadButton.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-sponsorships-donations-page.css";
import "../../styles/admin-broadcast-history-page.css";
import "../../styles/admin-broadcast-report-page.css";

const STATUS_OPTIONS = ["draft", "scheduled", "sending", "sent", "partially_sent", "failed", "cancelled"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "recipients", label: "Most recipients" },
  { value: "performance", label: "Best performance" },
];
const PAGE_SIZE = 20;

function statusBadgeClass(status) {
  if (status === "sent") return "admin-finance__badge--paid";
  if (status === "partially_sent") return "admin-finance__badge--pending";
  if (status === "failed" || status === "cancelled") return "admin-finance__badge--overdue";
  return "admin-finance__badge";
}

export default function AdminBroadcastHistoryPage() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const data = await apiFetch(`/api/admin/broadcasts/history?${params.toString()}`, { headers: adminAuthHeaders() });
      setBroadcasts(data.broadcasts || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Could not load broadcast history.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout pageTitle="Email Broadcast History" pageSubtitle="Every broadcast that has been sent or attempted.">
      <div className="admin-finance">
        <div className="admin-finance__toolbar">
          <div className="admin-finance__search">
            <IconSearch size={16} />
            <input
              type="text"
              placeholder="Search by campaign name or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="button" className="admin-finance__btn" onClick={load} disabled={loading}>
            <IconRefresh size={16} /> Refresh
          </button>
        </div>

        {error ? <p className="admin-broadcast-history__error" role="alert">{error}</p> : null}

        <div className="admin-finance__table-wrap">
          <table className="admin-finance__table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Campaign</th>
                <th>Recipient group</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Sent by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Loading…</td>
                </tr>
              ) : broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={8}>No broadcasts found.</td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr
                    key={b.id}
                    className="admin-broadcast-history__row"
                    onClick={() => navigate(`/admin/communication/broadcasts/${b.id}`)}
                  >
                    <td>{b.subject}</td>
                    <td>{b.campaignName}</td>
                    <td>{b.audienceSegment.replace(/_/g, " ")}</td>
                    <td>{b.recipientCount}</td>
                    <td>
                      <span className={`admin-finance__badge ${statusBadgeClass(b.status)}`}>{b.status.replace("_", " ")}</span>
                    </td>
                    <td>{b.sentAt ? new Date(b.sentAt).toLocaleString() : "—"}</td>
                    <td>{b.createdBy}</td>
                    <td>
                      {b.status === "sent" || b.status === "partially_sent" ? (
                        <BroadcastPdfDownloadButton broadcastId={b.id} initialStatus={b.pdfStatus} />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-broadcast-history__pagination">
          <button type="button" className="admin-finance__btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages} · {total} broadcast{total === 1 ? "" : "s"}
          </span>
          <button type="button" className="admin-finance__btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
