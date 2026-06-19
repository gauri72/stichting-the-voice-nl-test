import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IconArrowLeft, IconMail, IconReceipt, IconDownload, IconCheck } from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch, apiUrl } from "../../utils/api.js";
import "../../styles/admin-sponsorships-donations-page.css";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("nl-NL");
}

function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(minor || 0) / 100);
}

async function downloadBlob(url, filename) {
  const response = await fetch(apiUrl(url), { headers: adminAuthHeaders() });
  if (!response.ok) throw new Error("Download failed.");
  const blob = await response.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function DetailSection({ title, children }) {
  return (
    <section className="admin-finance-detail__section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function DetailRows({ rows }) {
  return (
    <dl className="admin-finance-detail__dl">
      {rows.map(([label, value]) => (
        <div key={label} className="admin-finance-detail__row">
          <dt>{label}</dt>
          <dd>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminSponsorshipDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const detail = await apiFetch(`/api/admin/sponsorships/${id}`, { headers: adminAuthHeaders() });
      setData(detail);
    } catch (err) {
      setError(err.message || "Could not load sponsorship.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function action(type) {
    try {
      if (type === "reminder") {
        await apiFetch(`/api/admin/sponsorships/${id}/send-reminder`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ templateType: "payment_reminder" }) });
      } else if (type === "receipt") {
        await apiFetch(`/api/admin/sponsorships/${id}/resend-receipt`, { method: "POST", headers: adminAuthHeaders() });
      } else if (type === "paid") {
        await apiFetch(`/api/admin/sponsorships/${id}/mark-paid`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ sendReceiptEmail: true }) });
      } else if (type === "thank_you") {
        await apiFetch(`/api/admin/sponsorships/${id}/send-reminder`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ templateType: "thank_you" }) });
      } else if (type === "download_receipt") {
        await downloadBlob(`/api/admin/sponsorships/${id}/download-receipt`, "receipt.pdf");
      } else if (type === "download_invoice") {
        await downloadBlob(`/api/admin/sponsorships/${id}/download-invoice`, "invoice.pdf");
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const s = data?.sponsorship;

  return (
    <AdminLayout pageTitle="Sponsorship Details" pageSubtitle={s?.sponsorshipId || ""}>
      <div className="admin-finance">
        <Link to="/admin/sponsorships" className="admin-finance-detail__back">
          <IconArrowLeft size={16} /> Back to Sponsorships
        </Link>

        {loading ? <p className="admin-finance__status">Loading…</p> : null}
        {error ? <p className="admin-finance__error">{error}</p> : null}

        {s ? (
          <>
            <div className="admin-finance-detail__actions">
              <button type="button" className="admin-finance__btn" onClick={() => action("reminder")}><IconMail size={16} /> Send Reminder</button>
              <button type="button" className="admin-finance__btn" onClick={() => action("receipt")}><IconReceipt size={16} /> Resend Receipt</button>
              <button type="button" className="admin-finance__btn" onClick={() => action("download_receipt")}><IconDownload size={16} /> Download Receipt</button>
              <button type="button" className="admin-finance__btn" onClick={() => action("download_invoice")}><IconDownload size={16} /> Download Invoice</button>
              <button type="button" className="admin-finance__btn" onClick={() => action("thank_you")}><IconMail size={16} /> Thank You Email</button>
              <button type="button" className="admin-finance__btn admin-finance__btn--accent" onClick={() => action("paid")}><IconCheck size={16} /> Mark as Paid</button>
            </div>

            <div className="admin-finance-detail__grid">
              <DetailSection title="Sponsor Profile">
                <DetailRows rows={[
                  ["Sponsor Name", s.sponsorName],
                  ["Company", s.companyName],
                  ["Contact Person", s.contactPerson],
                  ["Email", s.email],
                  ["Phone", s.phone],
                  ["Address", s.address],
                  ["VAT Number", s.vatNumber],
                  ["Website", s.website],
                ]} />
              </DetailSection>

              <DetailSection title="Sponsorship Details">
                <DetailRows rows={[
                  ["Package", s.packageName],
                  ["Benefits", s.packageBenefits],
                  ["Amount", formatMoney(s.amount)],
                  ["Campaign", s.campaignName],
                  ["Status", s.sponsorshipStatus],
                  ["Payment Status", s.paymentStatus],
                  ["Due Date", formatDate(s.dueDate)],
                  ["Invoice", s.invoiceNumber],
                  ["Receipt", s.receiptNumber],
                ]} />
              </DetailSection>

              <DetailSection title="Receipt History">
                {(data.receiptHistory || []).length ? (
                  <ul className="admin-finance-detail__timeline">
                    {data.receiptHistory.map((r) => (
                      <li key={r._id}>{r.receiptNumber} — {r.status} <time>{formatDate(r.sentAt || r.createdAt)}</time></li>
                    ))}
                  </ul>
                ) : <p className="admin-finance__status">No receipt logs yet.</p>}
              </DetailSection>

              <DetailSection title="Reminder History">
                {(data.reminderHistory || []).length ? (
                  <ul className="admin-finance-detail__timeline">
                    {data.reminderHistory.map((r) => (
                      <li key={r._id}>{r.templateType} → {r.recipientEmail} <time>{formatDate(r.sentAt)}</time></li>
                    ))}
                  </ul>
                ) : <p className="admin-finance__status">No reminders sent yet.</p>}
              </DetailSection>

              <DetailSection title="Internal Notes">
                {(s.internalNotes || []).length ? (
                  <ul className="admin-finance-detail__timeline">
                    {s.internalNotes.map((n, i) => (
                      <li key={i}>{n.text} <time>{formatDate(n.createdAt)}</time></li>
                    ))}
                  </ul>
                ) : <p className="admin-finance__status">No internal notes.</p>}
              </DetailSection>

              <DetailSection title="Activity Timeline">
                <ul className="admin-finance-detail__timeline">
                  {(data.activityTimeline || []).map((ev, i) => (
                    <li key={i}>{ev.label}{ev.detail ? `: ${ev.detail}` : ""} <time>{formatDate(ev.at)}</time></li>
                  ))}
                </ul>
              </DetailSection>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
