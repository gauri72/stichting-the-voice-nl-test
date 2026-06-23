import { Link } from "react-router-dom";
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
  const ctas = (section?.ctas || []).filter((c) => c.visible !== false);
  return (
    <section className="member-dashboard__support">
      <h2 className="member-dashboard__section-title">{section?.title || "Need Help?"}</h2>
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
            Contact Support
          </Link>
        )}
      </div>
    </section>
  );
}

export function CustomerDashboardProfileWidget({ section, profile }) {
  if (!profile) return null;
  return (
    <section className="member-dashboard__profile-widget">
      <h2 className="member-dashboard__section-title">{section?.title || "Profile Details"}</h2>
      <dl className="member-dashboard__profile-list">
        <div><dt>Name</dt><dd>{profile.fullName || "—"}</dd></div>
        <div><dt>Email</dt><dd>{profile.email || "—"}</dd></div>
        <div><dt>Phone</dt><dd>{profile.phone || "—"}</dd></div>
      </dl>
      <Link to={DASHBOARD_ROUTES.profile} className="member-dashboard__support-btn">
        Update Profile
      </Link>
    </section>
  );
}

export function CustomerDashboardMembershipStatus({ section, membership, hasMembership, planId }) {
  const active = membership?.active;
  return (
    <section className="dash-stats-section">
      <h2 className="dash-stats-section__title">{section?.title || "Membership Status"}</h2>
      {section?.description ? <p>{section.description}</p> : null}
      <div className="dash-stats__grid">
        <article className="dash-stats__card dash-stats__card--green">
          <p className="dash-stats__label">Status</p>
          <p className="dash-stats__value">{hasMembership ? active?.status || "Active" : "Not a member"}</p>
        </article>
        <article className="dash-stats__card dash-stats__card--teal">
          <p className="dash-stats__label">Plan</p>
          <p className="dash-stats__value">{active?.planName || planId || "—"}</p>
        </article>
        <article className="dash-stats__card dash-stats__card--blue">
          <p className="dash-stats__label">Valid until</p>
          <p className="dash-stats__value">{active?.validTo || "—"}</p>
        </article>
      </div>
    </section>
  );
}

export function CustomerDashboardMyTickets({ section }) {
  const ctaText = (section?.ctas || []).find((c) => c.visible !== false)?.text || "View Tickets";
  return (
    <section className="member-dashboard__tickets-widget">
      <h2 className="member-dashboard__section-title">{section?.title || "My Tickets"}</h2>
      {section?.description ? <p>{section.description}</p> : null}
      <Link to={DASHBOARD_ROUTES.myEvents} className="member-dashboard__support-btn">
        {ctaText}
      </Link>
    </section>
  );
}
