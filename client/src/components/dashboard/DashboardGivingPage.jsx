import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconHeartHandshake, IconUsersGroup, IconReceipt2 } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../utils/api.js";
import { DASHBOARD_ROUTES } from "./dashboardUtils.js";
import "../../styles/dashboard-my-events.css";
import "../../styles/dashboard-giving.css";

const COPY = {
  donations: {
    title: "My Donations",
    subtitle: "A history of every contribution you've made to our mission.",
    icon: IconHeartHandshake,
    tone: "green",
    summaryHeading: "Total Donated",
    emptyTitle: "No donations yet.",
    emptyBody: "Every contribution — large or small — supports our mission.",
    ctaLabel: "Make a Donation",
    ctaTo: DASHBOARD_ROUTES.donate,
    itemNoun: "donation",
  },
  sponsorships: {
    title: "My Sponsorships",
    subtitle: "A history of every sponsorship you've backed.",
    icon: IconUsersGroup,
    tone: "blue",
    summaryHeading: "Total Sponsored",
    emptyTitle: "No sponsorships yet.",
    emptyBody: "Sponsor an event or campaign to see it appear here.",
    ctaLabel: "Become a Sponsor",
    ctaTo: DASHBOARD_ROUTES.sponsorship,
    itemNoun: "sponsorship",
  },
};

function DashboardShell({ children }) {
  return (
    <div className="member-dashboard-viewport">
      <section className="member-dashboard dash-my-events-page">{children}</section>
    </div>
  );
}

function GivingCard({ item, tone, Icon }) {
  return (
    <li className={`dash-giving-card dash-giving-card--${tone}`}>
      <span className="dash-giving-card__icon" aria-hidden>
        <Icon size={20} stroke={1.75} />
      </span>
      <div className="dash-giving-card__body">
        <p className="dash-giving-card__label">{item.label}</p>
        <p className="dash-giving-card__date">{item.dateLabel}</p>
        {item.receiptNumber ? (
          <p className="dash-giving-card__receipt">
            <IconReceipt2 size={14} aria-hidden /> {item.receiptNumber}
          </p>
        ) : null}
      </div>
      <div className="dash-giving-card__amount-wrap">
        <span className="dash-giving-card__amount">{item.amountLabel}</span>
        <span className={`dash-giving-card__status dash-giving-card__status--${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      </div>
    </li>
  );
}

export default function DashboardGivingPage({ kind }) {
  const copy = COPY[kind];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch("/api/dashboard/giving", { headers: authHeaders() });
      setData(result?.[kind] || null);
    } catch (e) {
      setError(e.message || "Could not load this history.");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status">Loading your {copy.itemNoun} history…</div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status member-dashboard__status--error" role="alert">
          <p>{error}</p>
          <button type="button" className="member-dashboard__retry" onClick={load}>
            Try again
          </button>
        </div>
      </DashboardShell>
    );
  }

  const items = data?.items || [];
  const hasItems = items.length > 0;

  return (
    <DashboardShell>
      <header className="dash-my-events__hero">
        <Link to="/dashboard" className="dash-my-events__back">
          <IconArrowLeft size={18} aria-hidden /> Dashboard
        </Link>
        <h1 className="dash-my-events__page-title">{copy.title}</h1>
        <p className="dash-my-events__page-subtitle">{copy.subtitle}</p>
      </header>

      <div className={`dash-giving-summary dash-giving-summary--${copy.tone}`}>
        <span className="dash-giving-summary__icon" aria-hidden>
          <copy.icon size={28} stroke={1.75} />
        </span>
        <div>
          <p className="dash-giving-summary__heading">{copy.summaryHeading}</p>
          <p className="dash-giving-summary__value">{data?.totalLabel ?? "€ 0,00"}</p>
        </div>
        <span className="dash-giving-summary__count">
          {data?.count ?? 0} {copy.itemNoun}
          {data?.count === 1 ? "" : "s"}
        </span>
      </div>

      <section className="dash-my-events__section" aria-labelledby="giving-history-title">
        <h2 id="giving-history-title" className="dash-my-events__section-title">History</h2>
        {!hasItems ? (
          <div className="dash-my-events__empty">
            <copy.icon size={40} aria-hidden />
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyBody}</p>
            <Link to={copy.ctaTo} className="dash-my-events__btn dash-my-events__btn--primary">
              {copy.ctaLabel}
            </Link>
          </div>
        ) : (
          <ul className="dash-giving-list">
            {items.map((item) => (
              <GivingCard key={item.id} item={item} tone={copy.tone} Icon={copy.icon} />
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
