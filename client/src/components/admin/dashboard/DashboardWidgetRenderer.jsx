import {
  IconChartBar,
  IconCloudDownload,
  IconCreditCard,
  IconDownload,
  IconFileInvoice,
  IconHeart,
  IconHeartHandshake,
  IconMail,
  IconPlus,
  IconReceipt,
  IconReportMoney,
  IconSparkles,
  IconTicket,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { ReportBarChart, ReportLineChart, ReportPieChart } from "../reports/ReportCharts.jsx";
import { formatWidgetGridStyle } from "../../../utils/dashboardAdmin.js";

const ICON_MAP = {
  IconUsers,
  IconUserCheck,
  IconTicket,
  IconCreditCard,
  IconCloudDownload,
  IconMail,
  IconReceipt,
  IconDownload,
  IconPlus,
  IconFileInvoice,
  IconReportMoney,
  IconChartBar,
  IconHeartHandshake,
  IconHeart,
};

function resolveIcon(name) {
  return ICON_MAP[name] || IconChartBar;
}

function StatCard({ widget }) {
  const Icon = resolveIcon(widget.icon);
  const value = widget.data?.value ?? "—";
  return (
    <article className={`admin-dashboard-stat${widget.layout?.colSpan >= 4 ? " admin-dashboard-stat--wide" : ""}`}>
      {widget.icon ? (
        <span className="admin-dashboard-stat__icon" aria-hidden="true">
          <Icon size={22} stroke={1.6} />
        </span>
      ) : null}
      <p className="admin-dashboard-stat__value">{value}</p>
      <p className="admin-dashboard-stat__label">{widget.title}</p>
    </article>
  );
}

function StatGroup({ widget }) {
  const stats = widget.data?.stats || [];
  const isTt = widget.settings?.variant === "ticket_tailor";
  return (
    <section className={`admin-dashboard-section${isTt ? " admin-dashboard-section--tt" : ""}`}>
      {widget.title && widget.widgetType !== "section_header" ? (
        <div className="admin-dashboard-section-head">
          <h2 className="admin-dashboard-section-title">{widget.title}</h2>
          {widget.data?.meta?.lastSyncedAt ? (
            <p className="admin-dashboard-section-meta">
              Last synced {new Date(widget.data.meta.lastSyncedAt).toLocaleString()}
            </p>
          ) : null}
          {(widget.ctas || []).filter((c) => c.visible !== false).map((cta) => (
            <Link key={cta.id} to={cta.url} className="admin-dashboard-activity__link">
              {cta.text}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="admin-dashboard-stats">
        {stats.map((stat) => {
          const Icon = resolveIcon(stat.icon);
          return (
            <article key={stat.key || stat.label} className={`admin-dashboard-stat${isTt ? " admin-dashboard-stat--tt" : ""}`}>
              {stat.icon ? (
                <span className={`admin-dashboard-stat__icon${isTt ? " admin-dashboard-stat__icon--tt" : ""}`} aria-hidden="true">
                  <Icon size={22} stroke={1.6} />
                </span>
              ) : null}
              <p className="admin-dashboard-stat__value">{stat.value ?? "—"}</p>
              <p className="admin-dashboard-stat__label">{stat.label}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function WelcomeBanner({ widget, settings }) {
  return (
    <section className={`admin-dashboard-welcome admin-dashboard-welcome--${widget.settings?.backgroundStyle || "gradient"}`}>
      {settings?.announcement?.visible && settings.announcement.text ? (
        <p className="admin-dashboard-welcome__announcement">{settings.announcement.text}</p>
      ) : null}
      <h1 className="admin-dashboard-welcome__title">{settings?.welcomeMessage || widget.title}</h1>
      {settings?.subtitle ? <p className="admin-dashboard-welcome__subtitle">{settings.subtitle}</p> : null}
      {settings?.heroCard?.title ? (
        <div className="admin-dashboard-welcome__hero-card">
          <strong>{settings.heroCard.title}</strong>
          {settings.heroCard.description ? <p>{settings.heroCard.description}</p> : null}
          {settings.heroCard.ctaUrl ? (
            <Link to={settings.heroCard.ctaUrl} className="admin-dashboard-quick-action">
              {settings.heroCard.ctaText || "Learn more"}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function QuickActions({ widget }) {
  const actions = widget.data?.actions || widget.content?.actions || [];
  return (
    <section className="admin-dashboard-section">
      <h2 className="admin-dashboard-section-title">{widget.title || "Quick Actions"}</h2>
      <div className="admin-dashboard-quick-actions">
        {actions.map((action) => (
          <Link key={action.url + action.label} to={action.url} className="admin-dashboard-quick-action">
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActivityFeed({ widget }) {
  const items = widget.data?.items || [];
  return (
    <section className="admin-dashboard-activity">
      <div className="admin-dashboard-activity__header">
        <h2>{widget.title || "Recent Activity"}</h2>
        {(widget.ctas || []).filter((c) => c.visible !== false).map((cta) => (
          <Link key={cta.id} to={cta.url} className="admin-dashboard-activity__link">
            <IconMail size={16} aria-hidden />
            {cta.text}
          </Link>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="admin-dashboard-status">No recent activity yet.</p>
      ) : (
        <ul className="admin-dashboard-activity__list">
          {items.map((item) => (
            <li key={item.id} className="admin-dashboard-activity__item">
              <div>
                <p className="admin-dashboard-activity__summary">{item.summary}</p>
                {item.user ? (
                  <p className="admin-dashboard-activity__meta">
                    {item.user.firstName} {item.user.lastName} · {item.user.email}
                  </p>
                ) : null}
              </div>
              <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AiInsights({ widget }) {
  const insights = widget.data?.insights || [];
  return (
    <section className="admin-dashboard-section admin-dashboard-ai">
      <h2 className="admin-dashboard-section-title">
        <IconSparkles size={18} /> {widget.title || "AI Insights"}
      </h2>
      <div className="admin-dashboard-ai__grid">
        {insights.map((item) => (
          <article key={item.id} className={`admin-dashboard-ai__card admin-dashboard-ai__card--${item.trend || "neutral"}`}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            {item.metric ? <span className="admin-dashboard-ai__metric">{item.metric}</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function ChartWidget({ widget }) {
  const data = widget.data?.chartData || [];
  const height = (widget.layout?.rowSpan || 1) * 120 + 160;
  if (widget.widgetType === "pie_chart") return <ReportPieChart data={data} height={height} />;
  if (widget.widgetType === "line_chart" || widget.widgetType === "area_chart" || widget.widgetType === "trend_analysis") {
    return <ReportLineChart data={data} height={height} nameKey={data[0]?.date ? "date" : "name"} />;
  }
  return <ReportBarChart data={data} height={height} />;
}

function EmbeddedReport({ widget }) {
  const result = widget.data?.result;
  if (!result) return <p className="admin-dashboard-status">Report not configured.</p>;
  if (["bar_chart", "line_chart", "pie_chart"].includes(result.outputFormat)) {
    return <ChartWidget widget={{ ...widget, widgetType: result.outputFormat, data: { chartData: result.chartData } }} />;
  }
  return (
    <div className="admin-dashboard-report-table">
      <h3>{result.name}</h3>
      <table>
        <thead>
          <tr>{Object.keys(result.rows[0] || {}).map((k) => <th key={k}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const RENDERERS = {
  welcome_banner: WelcomeBanner,
  stat_card: StatCard,
  stat_group: StatGroup,
  kpi_card: StatGroup,
  revenue_card: StatCard,
  ticket_sales: StatGroup,
  membership_card: StatGroup,
  donation_card: StatGroup,
  sponsorship_card: StatGroup,
  quick_actions: QuickActions,
  activity_feed: ActivityFeed,
  ai_insight: AiInsights,
  section_header: ({ widget }) => <h2 className="admin-dashboard-section-title">{widget.title}</h2>,
  custom_html: ({ widget }) => (
    <div className="admin-dashboard-custom-html" dangerouslySetInnerHTML={{ __html: widget.data?.html || "" }} />
  ),
  embedded_report: EmbeddedReport,
  bar_chart: ChartWidget,
  line_chart: ChartWidget,
  area_chart: ChartWidget,
  pie_chart: ChartWidget,
  funnel_chart: ChartWidget,
  trend_analysis: ChartWidget,
};

export default function DashboardWidgetRenderer({ widgets = [], settings = {}, preview = false }) {
  if (!widgets.length) {
    return <p className="admin-dashboard-status">No dashboard widgets configured.</p>;
  }

  return (
    <div className={`admin-dashboard-grid${preview ? " admin-dashboard-grid--preview" : ""}`}>
      {widgets.map((widget) => {
        const Renderer = RENDERERS[widget.widgetType] || StatGroup;
        const style = formatWidgetGridStyle(widget);
        return (
          <div key={widget.widgetId} className="admin-dashboard-grid__item" style={style}>
            <Renderer widget={widget} settings={settings} />
          </div>
        );
      })}
    </div>
  );
}
