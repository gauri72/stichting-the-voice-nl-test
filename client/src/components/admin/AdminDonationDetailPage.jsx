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

export default function AdminDonationDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const detail = await apiFetch(`/api/admin/donations/${id}`, { headers: adminAuthHeaders() });
      setData(detail);
    } catch (err) {
      setError(err.message || "Could not load donation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function action(type) {
    try {
      if (type === "receipt") {
        await apiFetch(`/api/admin/donations/${id}/resend-receipt`, { method: "POST", headers: adminAuthHeaders() });
      } else if (type === "paid") {
        await apiFetch(`/api/admin/donations/${id}/mark-paid`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ sendReceiptEmail: true }) });
      } else if (type === "thank_you") {
        await apiFetch(`/api/admin/donations/${id}/send-reminder`, { method: "POST", headers: adminAuthHeaders(), body: JSON.stringify({ templateType: "thank_you" }) });
      } else if (type === "download") {
        await downloadBlob(`/api/admin/donations/${id}/download-receipt`, "donation-receipt.pdf");
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const d = data?.donation;
  const gh = data?.givingHistory;

  return (
    <AdminLayout pageTitle="Donation Details" pageSubtitle={d?.donationId || ""}>
      <div className="admin-finance">
        <Link to="/admin/donations" className="admin-finance-detail__back">
          <IconArrowLeft size={16} /> Back to Donations
        </Link>

        {loading ? <p className="admin-finance__status">Loading…</p> : null}
        {error ? <p className="admin-finance__error">{error}</p> : null}

        {d ? (
          <>
            <div className="admin-finance-detail__actions">
              <button type="button" className="admin-finance__btn" onClick={() => action("receipt")}><IconReceipt size={16} /> Resend Receipt</button>
              <button type="button" className="admin-finance__btn" onClick={() => action("download")}><IconDownload size={16} /> Download Receipt</button>
              <button type="button" className="admin-finance__btn" onClick={() => action("thank_you")}><IconMail size={16} /> Thank You Email</button>
              {d.paymentStatus !== "paid" ? (
                <button type="button" className="admin-finance__btn admin-finance__btn--accent" onClick={() => action("paid")}><IconCheck size={16} /> Mark as Paid</button>
              ) : null}
            </div>

            <div className="admin-finance-detail__grid">
              <section className="admin-finance-detail__section">
                <h3>Donor Profile</h3>
                <dl className="admin-finance-detail__dl">
                  {[["Donor Name", d.donorName], ["Email", d.email], ["Phone", d.phone], ["Address", d.address], ["Country", d.country], ["Anonymous", d.isAnonymous ? "Yes" : "No"], ["Newsletter", d.newsletterOptIn ? "Yes" : "No"]].map(([label, value]) => (
                    <div key={label} className="admin-finance-detail__row"><dt>{label}</dt><dd>{value || "—"}</dd></div>
                  ))}
                </dl>
              </section>

              <section className="admin-finance-detail__section">
                <h3>Donation Details</h3>
                <dl className="admin-finance-detail__dl">
                  {[["Type", d.donationType], ["Amount", formatMoney(d.amount)], ["Campaign", d.campaignName], ["Payment Method", d.paymentMethod], ["Payment Status", d.paymentStatus], ["Date", formatDate(d.donationDate)], ["Recurring", d.recurringStatus], ["Frequency", d.recurringFrequency], ["Receipt", d.receiptNumber]].map(([label, value]) => (
                    <div key={label} className="admin-finance-detail__row"><dt>{label}</dt><dd>{value || "—"}</dd></div>
                  ))}
                </dl>
              </section>

              {gh ? (
                <section className="admin-finance-detail__section">
                  <h3>Giving History</h3>
                  <dl className="admin-finance-detail__dl">
                    {[["Total Donated", gh.totalDonatedFormatted], ["Number of Donations", gh.numberOfDonations], ["Average Donation", gh.averageDonationFormatted], ["Last Donation", formatDate(gh.lastDonationDate)], ["Campaigns", (gh.campaignsSupported || []).join(", ") || "—"]].map(([label, value]) => (
                      <div key={label} className="admin-finance-detail__row"><dt>{label}</dt><dd>{value ?? "—"}</dd></div>
                    ))}
                  </dl>
                </section>
              ) : null}

              <section className="admin-finance-detail__section">
                <h3>Activity Timeline</h3>
                <ul className="admin-finance-detail__timeline">
                  {(data.activityTimeline || []).map((ev, i) => (
                    <li key={i}>{ev.label}{ev.detail ? `: ${ev.detail}` : ""} <time>{formatDate(ev.at)}</time></li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
