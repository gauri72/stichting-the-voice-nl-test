import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconArrowLeft, IconCopy, IconDownload, IconExternalLink, IconInfoCircle } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import BroadcastPdfDownloadButton from "./BroadcastPdfDownloadButton.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import "../../styles/admin-sponsorships-donations-page.css";
import "../../styles/admin-broadcast-history-page.css";
import "../../styles/admin-broadcast-report-page.css";

const TILE_DEFS = [
  { key: "sent", label: "Sent", tooltip: "Accepted for processing by the email provider." },
  { key: "delivered", label: "Delivered", tooltip: "Successfully delivered and not bounced." },
  { key: "opened", label: "Opened", tooltip: "Unique recipients who loaded the tracking pixel." },
  { key: "clicked", label: "Clicked", tooltip: "Unique recipients who clicked at least one tracked link." },
  { key: "bounced", label: "Bounced", tooltip: "Rejected by the receiving mail server." },
  { key: "failed", label: "Failed", tooltip: "Could not be submitted or processed." },
  { key: "unsubscribed", label: "Unsubscribed", tooltip: "Recipients who unsubscribed through this broadcast." },
];

const RECIPIENT_FILTERS = [
  { value: "", label: "All" },
  { value: "opened", label: "Opened" },
  { value: "not_opened", label: "Not opened" },
  { value: "clicked", label: "Clicked" },
  { value: "not_clicked", label: "Not clicked" },
  { value: "bounced", label: "Bounced" },
  { value: "failed", label: "Failed" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

function formatTileValue(tile) {
  if (!tile || tile.count === null || tile.count === undefined) return "—";
  return tile.count.toLocaleString();
}

function formatTilePercentage(tile) {
  if (!tile || tile.percentage === null || tile.percentage === undefined) return "Not enough data";
  return `${tile.percentage}%`;
}

function formatRate(value) {
  return value === null || value === undefined ? "Not enough data" : `${value}%`;
}

export default function AdminBroadcastReportPage() {
  const { broadcastId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [links, setLinks] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [recipientFilter, setRecipientFilter] = useState("");
  const [recipientPage, setRecipientPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportData, linksData] = await Promise.all([
        apiFetch(`/api/admin/broadcasts/${broadcastId}/report`, { headers: adminAuthHeaders() }),
        apiFetch(`/api/admin/broadcasts/${broadcastId}/links`, { headers: adminAuthHeaders() }),
      ]);
      setReport(reportData);
      setLinks(linksData.links || []);
    } catch (err) {
      setError(err.message || "Could not load this broadcast's report.");
    } finally {
      setLoading(false);
    }
  }, [broadcastId]);

  const loadRecipients = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(recipientPage), pageSize: "25" });
      if (recipientFilter) params.set("filter", recipientFilter);
      const data = await apiFetch(`/api/admin/broadcasts/${broadcastId}/recipients?${params.toString()}`, {
        headers: adminAuthHeaders(),
      });
      setRecipients(data.recipients || []);
      setRecipientTotal(data.total || 0);
    } catch {
      // Non-fatal — the tiles/funnel above already loaded; leave the recipient table empty.
    }
  }, [broadcastId, recipientFilter, recipientPage]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  useEffect(() => {
    setRecipientPage(1);
  }, [recipientFilter]);

  async function handleExportCsv() {
    const url = apiUrl(
      `/api/admin/broadcasts/${broadcastId}/recipients/export${recipientFilter ? `?filter=${recipientFilter}` : ""}`
    );
    const response = await fetch(url, { headers: adminAuthHeaders() });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `broadcast-${broadcastId}-recipients.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function handleDuplicate() {
    const templateId = report?.broadcast?.templateId;
    navigate(templateId ? `/admin/communication?templateId=${templateId}` : "/admin/communication");
  }

  if (loading) {
    return (
      <AdminLayout pageTitle="Broadcast Report" pageSubtitle="Loading…">
        <div className="admin-finance">
          <p>Loading report…</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !report) {
    return (
      <AdminLayout pageTitle="Broadcast Report" pageSubtitle="">
        <div className="admin-finance">
          <p className="admin-broadcast-report__error" role="alert">
            {error || "Broadcast not found."}
          </p>
        </div>
      </AdminLayout>
    );
  }

  const { broadcast, tiles, funnel, rates, providerCapabilities, openTrackingNote } = report;
  const maxFunnelCount = Math.max(...funnel.map((f) => f.count || 0), 1);
  const recipientTotalPages = Math.max(1, Math.ceil(recipientTotal / 25));

  return (
    <AdminLayout pageTitle={broadcast.campaignName} pageSubtitle={broadcast.subject}>
      <div className="admin-finance admin-broadcast-report">
        <button type="button" className="admin-broadcast-report__back" onClick={() => navigate("/admin/communication/broadcasts")}>
          <IconArrowLeft size={16} /> Back to history
        </button>

        <section className="admin-broadcast-report__header">
          <div className="admin-broadcast-report__header-grid">
            <div>
              <span>Recipient group</span>
              <strong>{broadcast.audienceSegment.replace(/_/g, " ")}</strong>
            </div>
            <div>
              <span>Total recipients</span>
              <strong>{broadcast.recipientCount.toLocaleString()}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{broadcast.status.replace("_", " ")}</strong>
            </div>
            <div>
              <span>Date sent</span>
              <strong>{broadcast.sentAt ? new Date(broadcast.sentAt).toLocaleString() : "—"}</strong>
            </div>
            <div>
              <span>Sent by</span>
              <strong>{broadcast.createdBy?.name || broadcast.createdBy?.email || "—"}</strong>
            </div>
          </div>
          <div className="admin-broadcast-report__header-actions">
            <button type="button" className="admin-finance__btn" onClick={handleDuplicate}>
              <IconCopy size={16} /> Duplicate broadcast
            </button>
            <button type="button" className="admin-finance__btn" onClick={handleExportCsv}>
              <IconDownload size={16} /> Export recipients CSV
            </button>
            <BroadcastPdfDownloadButton broadcastId={broadcast.id} initialStatus={broadcast.pdfStatus} />
          </div>
        </section>

        {!providerCapabilities.bounceTracking ? (
          <p className="admin-broadcast-report__note">
            <IconInfoCircle size={14} /> Delivered/Bounced counts require a delivery-webhook-capable email provider,
            which isn't configured — those tiles show "Not enough data" rather than an invented number.
          </p>
        ) : null}

        <section className="admin-broadcast-report__tiles">
          {TILE_DEFS.map((def) => (
            <article key={def.key} className="admin-broadcast-report__tile" title={def.tooltip}>
              <span className="admin-broadcast-report__tile-label">{def.label}</span>
              <strong className="admin-broadcast-report__tile-value">{formatTileValue(tiles[def.key])}</strong>
              <span className="admin-broadcast-report__tile-pct">{formatTilePercentage(tiles[def.key])}</span>
              {tiles[def.key]?.totalCount !== undefined ? (
                <span className="admin-broadcast-report__tile-total">{tiles[def.key].totalCount.toLocaleString()} total</span>
              ) : null}
            </article>
          ))}
        </section>

        <section className="admin-broadcast-report__rates">
          <div>
            <span>Delivery rate</span>
            <strong>{formatRate(rates.deliveryRate)}</strong>
          </div>
          <div>
            <span>Unique open rate</span>
            <strong>{formatRate(rates.uniqueOpenRate)}</strong>
          </div>
          <div>
            <span>Unique click-through rate</span>
            <strong>{formatRate(rates.uniqueClickThroughRate)}</strong>
          </div>
          <div>
            <span>Click-to-open rate</span>
            <strong>{formatRate(rates.clickToOpenRate)}</strong>
          </div>
          <div>
            <span>Bounce rate</span>
            <strong>{formatRate(rates.bounceRate)}</strong>
          </div>
        </section>
        <p className="admin-broadcast-report__tracking-note">{openTrackingNote}</p>

        <section className="admin-broadcast-report__funnel">
          <h2>Delivery funnel</h2>
          {funnel.map((stage) => (
            <div key={stage.stage} className="admin-broadcast-report__funnel-row">
              <span className="admin-broadcast-report__funnel-label">{stage.stage}</span>
              <div className="admin-broadcast-report__funnel-bar-wrap">
                <div
                  className="admin-broadcast-report__funnel-bar"
                  style={{ width: `${stage.count === null ? 0 : Math.max(4, (stage.count / maxFunnelCount) * 100)}%` }}
                />
              </div>
              <span className="admin-broadcast-report__funnel-count">{stage.count === null ? "—" : stage.count.toLocaleString()}</span>
            </div>
          ))}
        </section>

        <section>
          <h2>Link performance</h2>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Unique clicks</th>
                  <th>Total clicks</th>
                  <th>CTR</th>
                </tr>
              </thead>
              <tbody>
                {links.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No links in this template.</td>
                  </tr>
                ) : (
                  links.map((link) => (
                    <tr key={link.id}>
                      <td className="admin-broadcast-report__link-cell">
                        <span>{link.label || link.originalUrl}</span>
                        <a href={link.originalUrl} target="_blank" rel="noopener noreferrer">
                          {link.originalUrl} <IconExternalLink size={12} />
                        </a>
                      </td>
                      <td>{link.uniqueClicks}</td>
                      <td>{link.totalClicks}</td>
                      <td>{tiles.sent.count > 0 ? `${Math.round((link.uniqueClicks / tiles.sent.count) * 1000) / 10}%` : "Not enough data"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="admin-broadcast-report__recipients-head">
            <h2>Recipient activity</h2>
            <select value={recipientFilter} onChange={(e) => setRecipientFilter(e.target.value)}>
              {RECIPIENT_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-finance__table-wrap">
            <table className="admin-finance__table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Opened</th>
                  <th>Clicked</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {recipients.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No recipients match this filter.</td>
                  </tr>
                ) : (
                  recipients.map((r) => (
                    <tr key={r.id}>
                      <td>{r.email}</td>
                      <td>{r.status.replace("_", " ")}</td>
                      <td>{r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}</td>
                      <td>{r.firstOpenedAt ? `${new Date(r.firstOpenedAt).toLocaleDateString()} (${r.openCount}×)` : "—"}</td>
                      <td>{r.firstClickedAt ? `${new Date(r.firstClickedAt).toLocaleDateString()} (${r.clickCount}×)` : "—"}</td>
                      <td>{r.bounceReason || r.failureReason || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-broadcast-history__pagination">
            <button
              type="button"
              className="admin-finance__btn"
              disabled={recipientPage <= 1}
              onClick={() => setRecipientPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {recipientPage} of {recipientTotalPages} · {recipientTotal} recipient{recipientTotal === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="admin-finance__btn"
              disabled={recipientPage >= recipientTotalPages}
              onClick={() => setRecipientPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
