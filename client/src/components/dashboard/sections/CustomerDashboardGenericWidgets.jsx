import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DASHBOARD_ROUTES } from "../dashboardUtils.js";

export default function CustomerDashboardAnnouncements({ section, settings }) {
  const announcement = settings?.announcement;
  const text = section?.description || announcement?.text;
  if (!text && announcement?.visible === false) return null;
  if (!text) return null;

  return (
    <section className="member-dashboard__announcement" role="status">
      {section?.title ? <h2 className="member-dashboard__section-title">{section.title}</h2> : null}
      <p>{text}</p>
    </section>
  );
}

export function CustomerDashboardSupportWidget({ section }) {
  const { t } = useTranslation(["dashboardSections"]);
  const ctas = (section?.ctas || []).filter((c) => c.visible !== false);
  return (
    <section className="member-dashboard__support">
      <h2 className="member-dashboard__section-title">
        {section?.title || t("dashboardSections:genericWidgets.support.defaultTitle")}
      </h2>
      {section?.description ? <p>{section.description}</p> : null}
      <div className="member-dashboard__support-actions">
        {ctas.length ? (
          ctas.map((cta) => (
            <Link key={cta.id} to={cta.url || "/contact-us"} className="member-dashboard__support-btn">
              {cta.text}
            </Link>
          ))
        ) : (
          <Link to="/contact-us" className="member-dashboard__support-btn">
            {t("dashboardSections:genericWidgets.support.contactSupport")}
          </Link>
        )}
      </div>
    </section>
  );
}

export function CustomerDashboardProfileWidget({ section, profile }) {
  const { t } = useTranslation(["dashboardSections"]);
  if (!profile) return null;
  return (
    <section className="member-dashboard__profile-widget">
      <h2 className="member-dashboard__section-title">
        {section?.title || t("dashboardSections:genericWidgets.profile.defaultTitle")}
      </h2>
      <dl className="member-dashboard__profile-list">
        <div><dt>{t("dashboardSections:genericWidgets.profile.name")}</dt><dd>{profile.fullName || "—"}</dd></div>
        <div><dt>{t("dashboardSections:genericWidgets.profile.email")}</dt><dd>{profile.email || "—"}</dd></div>
        <div><dt>{t("dashboardSections:genericWidgets.profile.phone")}</dt><dd>{profile.phone || "—"}</dd></div>
      </dl>
      <Link to={DASHBOARD_ROUTES.profile} className="member-dashboard__support-btn">
        {t("dashboardSections:genericWidgets.profile.updateProfile")}
      </Link>
    </section>
  );
}

export function CustomerDashboardMembershipStatus({ section, membership, hasMembership, planId }) {
  const { t } = useTranslation(["dashboardSections"]);
  const active = membership?.active;
  return (
    <section className="dash-stats-section">
      <h2 className="dash-stats-section__title">
        {section?.title || t("dashboardSections:genericWidgets.membershipStatus.defaultTitle")}
      </h2>
      {section?.description ? <p>{section.description}</p> : null}
      <div className="dash-stats__grid">
        <article className="dash-stats__card dash-stats__card--green">
          <p className="dash-stats__label">{t("dashboardSections:genericWidgets.membershipStatus.status")}</p>
          <p className="dash-stats__value">
            {hasMembership
              ? active?.status || t("dashboardSections:genericWidgets.membershipStatus.activeDefault")
              : t("dashboardSections:genericWidgets.membershipStatus.notAMember")}
          </p>
        </article>
        <article className="dash-stats__card dash-stats__card--teal">
          <p className="dash-stats__label">{t("dashboardSections:genericWidgets.membershipStatus.plan")}</p>
          <p className="dash-stats__value">{active?.planName || planId || "—"}</p>
        </article>
        <article className="dash-stats__card dash-stats__card--blue">
          <p className="dash-stats__label">{t("dashboardSections:genericWidgets.membershipStatus.validUntil")}</p>
          <p className="dash-stats__value">{active?.validTo || "—"}</p>
        </article>
      </div>
    </section>
  );
}

export function CustomerDashboardMyTickets({ section }) {
  const { t } = useTranslation(["dashboardSections"]);
  const ctaText =
    (section?.ctas || []).find((c) => c.visible !== false)?.text ||
    t("dashboardSections:genericWidgets.myTickets.viewTickets");
  return (
    <section className="member-dashboard__tickets-widget">
      <h2 className="member-dashboard__section-title">
        {section?.title || t("dashboardSections:genericWidgets.myTickets.defaultTitle")}
      </h2>
      {section?.description ? <p>{section.description}</p> : null}
      <Link to={DASHBOARD_ROUTES.myEvents} className="member-dashboard__support-btn">
        {ctaText}
      </Link>
    </section>
  );
}
