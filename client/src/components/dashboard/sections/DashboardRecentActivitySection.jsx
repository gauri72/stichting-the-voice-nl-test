import { Link } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";
import {
  IconHeartHandshake,
  IconRefresh,
  IconShieldCheck,
  IconTicket,
  IconUserCheck,
  IconUsersGroup,
} from "@tabler/icons-react";
import {
  activityItemHref,
  DASHBOARD_RECENT_ACTIVITY_ID,
  scrollToId,
  timeAgo,
} from "../dashboardUtils.js";
import "../../../styles/dashboard-recent-activity-section.css";

const ACTIVITY_ICON_CONFIG = {
  membership: { Icon: IconRefresh, tone: "teal" },
  donation: { Icon: IconHeartHandshake, tone: "green" },
  event_ticket: { Icon: IconTicket, tone: "blue" },
  sponsorship: { Icon: IconUsersGroup, tone: "blue" },
  profile_updated: { Icon: IconUserCheck, tone: "teal" },
};

const FALLBACK_ICON = { Icon: IconShieldCheck, tone: "teal" };

export default function DashboardRecentActivitySection({ activity, quickActions }) {
  return (
    <section
      className="dash-activity-split"
      id={DASHBOARD_RECENT_ACTIVITY_ID}
      aria-label="Recent activity and quick actions"
    >
      <div className="dash-activity">
        <div className="dash-activity__head">
          <h2 className="dash-activity__title">Recent Activity</h2>
        </div>

        {activity.length === 0 ? (
          <p className="dash-activity__empty">
            Your membership, donations, sponsorships and event tickets will appear here.
          </p>
        ) : (
          <ul className="dash-activity__list">
            {activity.map((item) => {
              const config = ACTIVITY_ICON_CONFIG[item.kind] || FALLBACK_ICON;
              const Icon = config.Icon;
              const tone = config.tone;
              const destination = activityItemHref(item.kind);
              const content = (
                <>
                  <span
                    className={`dash-activity__icon dash-activity__icon--${tone}`}
                    aria-hidden
                  >
                    <Icon size={18} stroke={1.75} />
                  </span>
                  <div className="dash-activity__content">
                    <div className="dash-activity__body">
                      <p>{item.title}</p>
                      <small>{item.text}</small>
                    </div>
                    <time dateTime={item.at || undefined}>{timeAgo(item.at)}</time>
                  </div>
                </>
              );

              if (destination?.startsWith("#")) {
                return (
                  <li key={item.id} className="dash-activity__item">
                    <button
                      type="button"
                      className="dash-activity__item-link"
                      onClick={() => scrollToId(destination)}
                    >
                      {content}
                    </button>
                  </li>
                );
              }

              if (destination?.startsWith("http")) {
                return (
                  <li key={item.id} className="dash-activity__item">
                    <a
                      href={destination}
                      className="dash-activity__item-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </a>
                  </li>
                );
              }

              if (destination) {
                return (
                  <li key={item.id} className="dash-activity__item">
                    <Link to={destination} className="dash-activity__item-link">
                      {content}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.id} className="dash-activity__item">
                  {content}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="dash-quick-actions" aria-label="Quick actions">
        <h2 className="dash-quick-actions__title">Quick Actions</h2>
        {quickActions.map((action) =>
          action.to ? (
            <Link
              key={action.id}
              to={action.to}
              className={`dash-quick-action dash-quick-action--${action.tone || "teal"}`}
            >
              <span className="dash-quick-action__icon" aria-hidden>
                {action.icon}
              </span>
              <span className="dash-quick-action__label">{action.label}</span>
              <IconChevronRight className="dash-quick-action__arrow" size={18} stroke={2} aria-hidden />
            </Link>
          ) : (
            <button
              key={action.id}
              type="button"
              className={`dash-quick-action dash-quick-action--${action.tone || "teal"}`}
              onClick={action.onClick}
            >
              <span className="dash-quick-action__icon" aria-hidden>
                {action.icon}
              </span>
              <span className="dash-quick-action__label">{action.label}</span>
              <IconChevronRight className="dash-quick-action__arrow" size={18} stroke={2} aria-hidden />
            </button>
          ),
        )}
      </div>
    </section>
  );
}
