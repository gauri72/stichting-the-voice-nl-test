import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconCreditCard,
  IconCloudDownload,
  IconMail,
  IconTicket,
  IconUserCheck,
  IconUsers,
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

