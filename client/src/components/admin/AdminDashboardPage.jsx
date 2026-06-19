import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconCreditCard,
  IconCloudDownload,
  IconMail,
  IconTicket,
  IconUserCheck,
  IconUsers,
  IconHeartHandshake,
  IconHeart,
  IconPlus,
  IconReceipt,
  IconDownload,
  IconReportMoney,
  IconFileInvoice,
  IconChartBar,
} from "@tabler/icons-react";
import AdminLayout from "./AdminLayout.jsx";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import "../../styles/admin-dashboard-page.css";

const STAT_CARDS = [
  { key: "totalUsers", label: "Registered Users", icon: IconUsers },
  { key: "verifiedUsers", label: "Verified Users", icon: IconUserCheck },
  { key: "totalMembers", label: "Members", icon: IconTicket },
  { key: "activeMemberships", label: "Active Memberships", icon: IconUsers },
  { key: "totalPayments", label: "Paid Transactions", icon: IconCreditCard },
];

export default function AdminDashboardPage() {
  const [payload, setPayload] = useState(null);
  const [ticketStats, setTicketStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [data, statsData] = await Promise.all([
          apiFetch("/api/admin/dashboard", { headers: adminAuthHeaders() }),
          apiFetch("/api/admin/events/stats", { headers: adminAuthHeaders() }).catch(() => null),
        ]);
        if (!cancelled) {
          setPayload(data);
          setTicketStats(statsData?.stats || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Could not load admin dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const overview = payload?.overview;
  const ticketTailor = payload?.ticketTailor;
  const sponsorships = payload?.sponsorships;
  const donations = payload?.donations;
  const finance = payload?.finance;
  const recentActivity = payload?.recentActivity || [];

  return (
    <AdminLayout pageTitle="Dashboard" pageSubtitle="Overview of users, memberships, and activity.">
      <div className="admin-dashboard-main">
        {loading ? (
          <p className="admin-dashboard-status" role="status">
            Loading dashboard data…
          </p>
        ) : null}

        {error ? (
          <p className="admin-dashboard-error" role="alert">
            {error}
          </p>
        ) : null}

        {overview ? (
          <>
            <section className="admin-dashboard-stats" aria-label="Overview statistics">
              {STAT_CARDS.map(({ key, label, icon: Icon }) => (
                <article key={key} className="admin-dashboard-stat">
                  <span className="admin-dashboard-stat__icon" aria-hidden="true">
                    <Icon size={22} stroke={1.6} />
                  </span>
                  <p className="admin-dashboard-stat__value">{overview[key]}</p>
                  <p className="admin-dashboard-stat__label">{label}</p>
                </article>
              ))}
              <article className="admin-dashboard-stat admin-dashboard-stat--wide">
                <span className="admin-dashboard-stat__icon" aria-hidden="true">
                  <IconCreditCard size={22} stroke={1.6} />
                </span>
                <p className="admin-dashboard-stat__value">{overview.totalRevenue}</p>
                <p className="admin-dashboard-stat__label">Total Revenue (paid)</p>
              </article>
            </section>

            {ticketStats ? (
              <section className="admin-dashboard-section" aria-label="Platform ticketing statistics">
                <h2 className="admin-dashboard-section-title">Platform Tickets</h2>
                <div className="admin-dashboard-stats">
                <article className="admin-dashboard-stat">
                  <span className="admin-dashboard-stat__icon" aria-hidden="true">
                    <IconTicket size={22} stroke={1.6} />
                  </span>
                  <p className="admin-dashboard-stat__value">{ticketStats.totalTicketsSold}</p>
                  <p className="admin-dashboard-stat__label">Tickets Sold</p>
                </article>
                <article className="admin-dashboard-stat">
                  <p className="admin-dashboard-stat__value">{ticketStats.totalRevenue}</p>
                  <p className="admin-dashboard-stat__label">Ticket Revenue</p>
                </article>
                <article className="admin-dashboard-stat">
                  <p className="admin-dashboard-stat__value">{ticketStats.ticketsCheckedIn}</p>
                  <p className="admin-dashboard-stat__label">Checked In</p>
                </article>
                <article className="admin-dashboard-stat">
                  <p className="admin-dashboard-stat__value">{ticketStats.remainingCapacity}</p>
                  <p className="admin-dashboard-stat__label">Remaining Capacity</p>
                </article>
                <article className="admin-dashboard-stat">
                  <p className="admin-dashboard-stat__value">{ticketStats.refundedTickets}</p>
                  <p className="admin-dashboard-stat__label">Refunded</p>
                </article>
                </div>
              </section>
            ) : null}

            {ticketTailor ? (
              <section className="admin-dashboard-section admin-dashboard-section--tt" aria-label="TicketTailor statistics">
                <div className="admin-dashboard-section-head">
                  <h2 className="admin-dashboard-section-title">TicketTailor</h2>
                  {ticketTailor.lastSyncedAt ? (
                    <p className="admin-dashboard-section-meta">
                      Last synced {new Date(ticketTailor.lastSyncedAt).toLocaleString()}
                    </p>
                  ) : (
                    <p className="admin-dashboard-section-meta">Not synced yet — use Memberships → Sync TT</p>
                  )}
                </div>
                <div className="admin-dashboard-stats">
                {[
                  { label: "Memberships", value: ticketTailor.memberships, icon: IconUsers },
                  { label: "Customers", value: ticketTailor.customers, icon: IconUsers },
                  { label: "Historical Orders", value: ticketTailor.historicalOrders, icon: IconCloudDownload },
                  { label: "Synced Bookings", value: ticketTailor.syncedBookings, icon: IconTicket },
                  { label: "TT Revenue", value: ticketTailor.revenue, icon: IconCreditCard },
                  { label: "Checked In", value: ticketTailor.checkedIn, icon: IconTicket },
                  { label: "Member-linked", value: ticketTailor.memberLinkedBookings, icon: IconUserCheck },
                ].map(({ label, value, icon: Icon }) => (
                  <article key={label} className="admin-dashboard-stat admin-dashboard-stat--tt">
                    <span className="admin-dashboard-stat__icon admin-dashboard-stat__icon--tt" aria-hidden="true">
                      <Icon size={22} stroke={1.6} />
                    </span>
                    <p className="admin-dashboard-stat__value">{value}</p>
                    <p className="admin-dashboard-stat__label">{label}</p>
                  </article>
                ))}
                </div>
                <Link to="/admin/memberships" className="admin-dashboard-tt-link">
                  <IconCloudDownload size={16} /> View memberships &amp; sync TicketTailor
                </Link>
              </section>
            ) : null}

            <section className="admin-dashboard-section" aria-label="Quick actions">
              <h2 className="admin-dashboard-section-title">Quick Actions</h2>
              <div className="admin-dashboard-quick-actions">
                <Link to="/admin/sponsorships" className="admin-dashboard-quick-action">Send Sponsorship Reminder</Link>
                <Link to="/admin/donations" className="admin-dashboard-quick-action">Resend Donation Receipt</Link>
                <Link to="/admin/donations" className="admin-dashboard-quick-action"><IconDownload size={14} /> Export Donations</Link>
                <Link to="/admin/sponsorships" className="admin-dashboard-quick-action"><IconPlus size={14} /> Add Sponsor</Link>
                <Link to="/admin/donations" className="admin-dashboard-quick-action"><IconPlus size={14} /> Add Donation</Link>
                <Link to="/admin/finance/invoices" className="admin-dashboard-quick-action"><IconFileInvoice size={14} /> Create Invoice</Link>
                <Link to="/admin/finance/event-budgets" className="admin-dashboard-quick-action"><IconReportMoney size={14} /> Create Budget Sheet</Link>
                <Link to="/admin/finance/transactions" className="admin-dashboard-quick-action"><IconPlus size={14} /> Add Transaction</Link>
                <Link to="/admin/finance/audit-reports" className="admin-dashboard-quick-action"><IconReceipt size={14} /> Generate Audit Report</Link>
              </div>
            </section>

            {finance ? (
              <section className="admin-dashboard-section" aria-label="Finance statistics">
                <div className="admin-dashboard-section-head">
                  <h2 className="admin-dashboard-section-title">Finance &amp; Audit</h2>
                  <Link to="/admin/finance/reports" className="admin-dashboard-activity__link">
                    <IconReportMoney size={16} /> View financial reports
                  </Link>
                </div>
                <div className="admin-dashboard-stats">
                  {[
                    { label: "Total Income", value: finance.totalIncome, icon: IconCreditCard },
                    { label: "Total Expenses", value: finance.totalExpenses, icon: IconReceipt },
                    { label: "Net Result", value: finance.netResult, icon: IconReportMoney },
                    { label: "Pending Invoices", value: finance.pendingInvoices, icon: IconMail },
                    { label: "Overdue Invoices", value: finance.overdueInvoices, icon: IconMail },
                    { label: "Budget Variance", value: finance.eventBudgetVariance, icon: IconChartBar },
                    { label: "Audit Reports", value: finance.auditReportsGenerated, icon: IconReceipt },
                    { label: "Receipts Missing", value: finance.receiptsMissing, icon: IconDownload },
                  ].map(({ label, value, icon: Icon }) => (
                    <article key={label} className="admin-dashboard-stat">
                      <span className="admin-dashboard-stat__icon" aria-hidden="true"><Icon size={22} stroke={1.6} /></span>
                      <p className="admin-dashboard-stat__value">{value}</p>
                      <p className="admin-dashboard-stat__label">{label}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {sponsorships ? (
              <section className="admin-dashboard-section" aria-label="Sponsorship statistics">
                <div className="admin-dashboard-section-head">
                  <h2 className="admin-dashboard-section-title">Sponsorships</h2>
                  <Link to="/admin/sponsorships" className="admin-dashboard-activity__link">
                    <IconHeartHandshake size={16} /> Manage sponsorships
                  </Link>
                </div>
                <div className="admin-dashboard-stats">
                  {[
                    { label: "Sponsorship Revenue", value: sponsorships.sponsorshipRevenue, icon: IconCreditCard },
                    { label: "Pending Payments", value: sponsorships.pendingPayments, icon: IconMail },
                    { label: "Active Sponsors", value: sponsorships.activeSponsorships, icon: IconUsers },
                    { label: "Follow-ups Due", value: sponsorships.followUpsDue, icon: IconReceipt },
                  ].map(({ label, value, icon: Icon }) => (
                    <article key={label} className="admin-dashboard-stat">
                      <span className="admin-dashboard-stat__icon" aria-hidden="true"><Icon size={22} stroke={1.6} /></span>
                      <p className="admin-dashboard-stat__value">{value}</p>
                      <p className="admin-dashboard-stat__label">{label}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {donations ? (
              <section className="admin-dashboard-section" aria-label="Donation statistics">
                <div className="admin-dashboard-section-head">
                  <h2 className="admin-dashboard-section-title">Donations</h2>
                  <Link to="/admin/donations" className="admin-dashboard-activity__link">
                    <IconHeart size={16} /> Manage donations
                  </Link>
                </div>
                <div className="admin-dashboard-stats">
                  {[
                    { label: "Donation Revenue", value: donations.donationRevenue, icon: IconCreditCard },
                    { label: "Total Donors", value: donations.totalDonors, icon: IconUsers },
                    { label: "Recurring Donors", value: donations.recurringDonations, icon: IconHeart },
                    { label: "Pending Receipts", value: donations.pendingReceipts, icon: IconReceipt },
                  ].map(({ label, value, icon: Icon }) => (
                    <article key={label} className="admin-dashboard-stat">
                      <span className="admin-dashboard-stat__icon" aria-hidden="true"><Icon size={22} stroke={1.6} /></span>
                      <p className="admin-dashboard-stat__value">{value}</p>
                      <p className="admin-dashboard-stat__label">{label}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="admin-dashboard-activity" aria-labelledby="admin-activity-title">
              <div className="admin-dashboard-activity__header">
                <h2 id="admin-activity-title">Recent Activity</h2>
                <Link to="/admin/communication" className="admin-dashboard-activity__link">
                  <IconMail size={16} aria-hidden />
                  Email broadcasts
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <p className="admin-dashboard-status">No recent activity yet.</p>
              ) : (
                <ul className="admin-dashboard-activity__list">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="admin-dashboard-activity__item">
                      <div>
                        <p className="admin-dashboard-activity__summary">{item.summary}</p>
                        {item.user ? (
                          <p className="admin-dashboard-activity__meta">
                            {item.user.firstName} {item.user.lastName} · {item.user.email}
                          </p>
                        ) : null}
                      </div>
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

