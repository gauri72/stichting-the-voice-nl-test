import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconHeartHandshake, IconUsersGroup, IconReceipt2 } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../utils/api.js";
import { DASHBOARD_ROUTES } from "./dashboardUtils.js";
import "../../styles/dashboard-my-events.css";
import "../../styles/dashboard-giving.css";

const COPY = {
  donations: {
    i18nKey: "donations",
    icon: IconHeartHandshake,
    tone: "green",
    ctaTo: DASHBOARD_ROUTES.donate,
  },
  sponsorships: {
    i18nKey: "sponsorships",
    icon: IconUsersGroup,
    tone: "blue",
    ctaTo: DASHBOARD_ROUTES.sponsorship,
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
  const { t } = useTranslation(["dashboardMain"]);
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
      setError(e.message || t("dashboardMain:giving.loadError"));
    } finally {
      setLoading(false);
    }
  }, [kind, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status">{t(`dashboardMain:giving.${copy.i18nKey}.loading`)}</div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="member-dashboard__status member-dashboard__status--error" role="alert">
          <p>{error}</p>
          <button type="button" className="member-dashboard__retry" onClick={load}>
            {t("dashboardMain:common.tryAgain")}
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
          <IconArrowLeft size={18} aria-hidden /> {t("dashboardMain:common.dashboardLink")}
        </Link>
        <h1 className="dash-my-events__page-title">{t(`dashboardMain:giving.${copy.i18nKey}.title`)}</h1>
        <p className="dash-my-events__page-subtitle">{t(`dashboardMain:giving.${copy.i18nKey}.subtitle`)}</p>
      </header>

      <div className={`dash-giving-summary dash-giving-summary--${copy.tone}`}>
        <span className="dash-giving-summary__icon" aria-hidden>
          <copy.icon size={28} stroke={1.75} />
        </span>
        <div>
          <p className="dash-giving-summary__heading">{t(`dashboardMain:giving.${copy.i18nKey}.summaryHeading`)}</p>
          <p className="dash-giving-summary__value">{data?.totalLabel ?? "€ 0,00"}</p>
        </div>
        <span className="dash-giving-summary__count">
          {t(`dashboardMain:giving.${copy.i18nKey}.countLabel`, { count: data?.count ?? 0 })}
        </span>
      </div>

      <section className="dash-my-events__section" aria-labelledby="giving-history-title">
        <h2 id="giving-history-title" className="dash-my-events__section-title">{t("dashboardMain:giving.historyHeading")}</h2>
        {!hasItems ? (
          <div className="dash-my-events__empty">
            <copy.icon size={40} aria-hidden />
            <h2>{t(`dashboardMain:giving.${copy.i18nKey}.emptyTitle`)}</h2>
            <p>{t(`dashboardMain:giving.${copy.i18nKey}.emptyBody`)}</p>
            <Link to={copy.ctaTo} className="dash-my-events__btn dash-my-events__btn--primary">
              {t(`dashboardMain:giving.${copy.i18nKey}.ctaLabel`)}
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
