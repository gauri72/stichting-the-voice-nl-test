import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { IconChevronRight } from "@tabler/icons-react";
import {
  IconHeartHandshake,
  IconRefresh,
  IconShieldCheck,
  IconTicket,
  IconUserCheck,
  IconUsersGroup,
} from "@tabler/icons-react";
import { timeAgo } from "../dashboardUtils.js";
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
    <section className="dash-activity-split" aria-label="Recent activity and quick actions">
      <div className="dash-activity">
        <div className="dash-activity__head">
          <h2 className="dash-activity__title">Recent Activity</h2>
          <Link to="/events" className="dash-activity__viewall">
            View All <FaArrowRight aria-hidden />
          </Link>
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

              return (
                <li key={item.id} className="dash-activity__item">
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
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="dash-quick-actions" aria-label="Quick actions">
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
