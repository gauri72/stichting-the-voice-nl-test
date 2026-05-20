import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  FaArrowsAltH,
  FaChevronRight,
  FaHeart,
  FaPlus,
  FaCircle,
  FaRegCircle,
  FaSignOutAlt,
  FaStar,
  FaTh,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import LoginCtaSection from "../../login/LoginCtaSection.jsx";
import DashboardMembershipsPanel from "./DashboardMembershipsPanel.jsx";
import heroBackground from "../../../assets/Dashboard/hero-bg.png";
import "../../../styles/donate-hero-section.css";
import "../../../styles/dashboard-design-one.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", scrollTo: "dashboard-overview" },
  { id: "memberships", label: "Memberships", panel: "memberships" },
  { id: "donations", label: "Donations", href: "/donate" },
  { id: "events", label: "Event Registrations", href: "/events" },
  { id: "sponsorships", label: "Sponsorships", href: "/sponsorship" },
  { id: "orders", label: "My Orders", scrollTo: "dashboard-cta" },
  { id: "account", label: "Account Details", scrollTo: "dashboard-account-details" },
  { id: "addresses", label: "Addresses", scrollTo: "dashboard-account-details" },
  { id: "payment", label: "Payment Methods", scrollTo: "dashboard-account-details" },
  { id: "password", label: "Change Password", scrollTo: "dashboard-account-details" },
];

const OVERVIEW_CARD_DEFS = [
  {
    key: "membership",
    overviewKey: "membership",
    icon: <FaStar />,
    action: "View Membership",
    to: "/membership",
  },
  {
    key: "donations",
    overviewKey: "donations",
    icon: <FaHeart />,
    action: "View Donations",
    to: "/donate",
  },
  {
    key: "events",
    overviewKey: "events",
    icon: <FaTh />,
    action: "View Events",
    to: "/events",
  },
  {
    key: "sponsorships",
    overviewKey: "sponsorships",
    icon: <FaArrowsAltH />,
    action: "View Sponsorships",
    to: "/sponsorship",
  },
];

function formatActivityDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function DashboardDesignOne() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const formId = useId();

  const [activeNavId, setActiveNavId] = useState("dashboard");
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const [accountDraft, setAccountDraft] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const loadDashboard = useCallback(async () => {
    setLoadError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/dashboard", { headers: authHeaders() });
      setDashboard(data);
      const p = data.profile || {};
      setAccountDraft({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        phone: p.phone || "",
      });
    } catch (e) {
      setLoadError(e.message || "Could not load your dashboard.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const profile = dashboard?.profile;
  const overview = dashboard?.overview;
  const activitySource = dashboard?.activity || [];
  const activityItems = activityExpanded ? activitySource : activitySource.slice(0, 4);

  const overviewCards = useMemo(() => {
    if (!overview) return [];
    return OVERVIEW_CARD_DEFS.map((def) => {
      const block = overview[def.overviewKey] || {};
      return {
        ...def,
        value: block.value ?? "—",
        heading: block.heading || "—",
        description: block.description || "",
      };
    });
  }, [overview]);

  const scrollToId = useCallback((elementId) => {
    const el = document.getElementById(elementId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNavClick = useCallback(
    (item) => {
      setActiveNavId(item.id);
      setIsEditingAccount(false);
      if (item.href) {
        navigate(item.href);
        return;
      }
      if (item.panel) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (item.scrollTo) {
        scrollToId(item.scrollTo);
      }
    },
    [navigate, scrollToId],
  );

  const handleStartEdit = () => {
    setSaveError("");
    if (profile) {
      setAccountDraft({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
      });
    }
    setIsEditingAccount(true);
  };

  const handleCancelEdit = () => {
    setSaveError("");
    if (profile) {
      setAccountDraft({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
      });
    }
    setIsEditingAccount(false);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      await apiFetch("/api/auth/me", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          firstName: accountDraft.firstName.trim(),
          lastName: accountDraft.lastName.trim(),
          phone: accountDraft.phone.trim(),
        }),
      });
      await refreshUser();
      await loadDashboard();
      setIsEditingAccount(false);
    } catch (err) {
      setSaveError(err.data?.error || err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "";
  const displayEmail = profile?.email || user?.email || "";

  return (
    <section className="dashboard-design-one" id="dashboard-navbar-top">
      <section
        className="donate-page-hero"
        aria-labelledby="dashboard-hero-title"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="donate-page-hero__container">
          <h1 id="dashboard-hero-title">
            <span className="donate-page-hero__title-line">Welcome Back!</span>
            <span className="donate-page-hero__title-gradient">Manage Your Account</span>
          </h1>
          <p className="donate-page-hero__intro">
            View your membership, donations, event registrations and update your account details.
          </p>
        </div>
      </section>

      <div className="dashboard-design-one__body">
        <aside className="dashboard-design-one__sidebar">
          <div className="dashboard-user-card">
            <div className="dashboard-user-card__avatar" aria-hidden>
              <FaUserCircle />
            </div>
            <div>
              <p className="dashboard-user-card__hello">Hello,</p>
              <p className="dashboard-user-card__name">{displayName || "—"}</p>
              <p className="dashboard-user-card__mail">{displayEmail || "—"}</p>
            </div>
          </div>

          <nav className="dashboard-side-nav" aria-label="Dashboard sections">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`dashboard-side-nav__item ${activeNavId === item.id ? "is-active" : ""}`}
                onClick={() => handleNavClick(item)}
              >
                {activeNavId === item.id ? (
                  <FaCircle aria-hidden className="dashboard-side-nav__bullet" />
                ) : (
                  <FaRegCircle aria-hidden className="dashboard-side-nav__bullet" />
                )}
                <span>{item.label}</span>
              </button>
            ))}
            <button type="button" className="dashboard-side-nav__item" onClick={logout}>
              <FaSignOutAlt aria-hidden />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        <div className="dashboard-design-one__content" id="dashboard-overview">
          {loading ? (
            <p className="dashboard-design-one__loading">Loading your account…</p>
          ) : null}
          {loadError ? (
            <div className="dashboard-design-one__alert" role="alert">
              <p>{loadError}</p>
              <button type="button" className="dashboard-panel__outline" onClick={loadDashboard}>
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !loadError && activeNavId === "memberships" ? (
            <DashboardMembershipsPanel />
          ) : null}

          {!loading && !loadError && activeNavId === "dashboard" ? (
            <>
              <h2 className="dashboard-design-one__title">Account Overview</h2>
              <div className="dashboard-stats-grid">
                {overviewCards.map((card) => (
                  <article key={card.key} className="dashboard-stat-card">
                    <span className="dashboard-stat-card__icon" aria-hidden>
                      {card.icon}
                    </span>
                    <p className="dashboard-stat-card__value">{card.value}</p>
                    <p className="dashboard-stat-card__heading">{card.heading}</p>
                    <p className="dashboard-stat-card__description">{card.description}</p>
                    {card.key === "membership" ? (
                      <button
                        type="button"
                        className="dashboard-stat-card__action"
                        onClick={() =>
                          handleNavClick(
                            NAV_ITEMS.find((n) => n.id === "memberships") || {
                              id: "memberships",
                              label: "Memberships",
                              panel: "memberships",
                            },
                          )
                        }
                      >
                        {card.action}
                      </button>
                    ) : (
                      <Link to={card.to} className="dashboard-stat-card__action">
                        {card.action}
                      </Link>
                    )}
                  </article>
                ))}
              </div>

              <div className="dashboard-panels-grid">
                <article className="dashboard-panel" id="dashboard-recent-activity">
                  <h3 className="dashboard-panel__heading">Recent Activity</h3>
                  {activityItems.length === 0 ? (
                    <p className="dashboard-design-one__muted">
                      No activity yet. Membership purchases, donations, sponsorships, and event tickets will
                      appear here when they are linked to your account email.
                    </p>
                  ) : (
                    <ul className="dashboard-activity-list">
                      {activityItems.map((item) => (
                        <li key={item.id}>
                          <span className="dashboard-activity-list__icon" aria-hidden>
                            <FaPlus />
                          </span>
                          <div className="dashboard-activity-list__body">
                            <p>{item.title}</p>
                            <small>{item.text}</small>
                          </div>
                          <time dateTime={item.at || undefined}>{formatActivityDate(item.at)}</time>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activitySource.length > 4 ? (
                    <button
                      type="button"
                      className="dashboard-panel__link"
                      onClick={() => setActivityExpanded((v) => !v)}
                      aria-expanded={activityExpanded}
                    >
                      {activityExpanded ? "Show less" : "View All Activity"}
                      <FaChevronRight className={activityExpanded ? "is-flipped" : ""} aria-hidden />
                    </button>
                  ) : null}
                </article>

                <article
                  className="dashboard-panel dashboard-panel--account"
                  id="dashboard-account-details"
                >
                  <h3 className="dashboard-panel__heading">Account Details</h3>
                  {!isEditingAccount ? (
                    <>
                      <dl className="dashboard-details-list">
                        <div>
                          <dt>Full Name</dt>
                          <dd>{profile?.fullName || "—"}</dd>
                        </div>
                        <div>
                          <dt>Email Address</dt>
                          <dd>{profile?.email || "—"}</dd>
                        </div>
                        <div>
                          <dt>Phone Number</dt>
                          <dd>{profile?.phone?.trim() ? profile.phone : "—"}</dd>
                        </div>
                        <div>
                          <dt>Member Since</dt>
                          <dd>{profile?.memberSince || "—"}</dd>
                        </div>
                        <div>
                          <dt>Account Status</dt>
                          <dd>{profile?.accountStatus || "—"}</dd>
                        </div>
                      </dl>
                      <button type="button" className="dashboard-panel__outline" onClick={handleStartEdit}>
                        Edit Account Details
                      </button>
                    </>
                  ) : (
                    <form className="dashboard-account-form" onSubmit={handleSaveAccount} id={formId}>
                      {saveError ? (
                        <p className="dashboard-design-one__form-error" role="alert">
                          {saveError}
                        </p>
                      ) : null}
                      <label className="dashboard-account-form__field">
                        <span>First name</span>
                        <input
                          type="text"
                          value={accountDraft.firstName}
                          onChange={(evt) =>
                            setAccountDraft((d) => ({ ...d, firstName: evt.target.value }))
                          }
                          autoComplete="given-name"
                          required
                        />
                      </label>
                      <label className="dashboard-account-form__field">
                        <span>Last name</span>
                        <input
                          type="text"
                          value={accountDraft.lastName}
                          onChange={(evt) =>
                            setAccountDraft((d) => ({ ...d, lastName: evt.target.value }))
                          }
                          autoComplete="family-name"
                          required
                        />
                      </label>
                      <label className="dashboard-account-form__field">
                        <span>Email address</span>
                        <input type="email" value={profile?.email || ""} disabled readOnly />
                      </label>
                      <label className="dashboard-account-form__field">
                        <span>Phone number</span>
                        <input
                          type="tel"
                          value={accountDraft.phone}
                          onChange={(evt) =>
                            setAccountDraft((d) => ({ ...d, phone: evt.target.value }))
                          }
                          autoComplete="tel"
                        />
                      </label>
                      <label className="dashboard-account-form__field">
                        <span>Member since</span>
                        <input type="text" value={profile?.memberSince || ""} readOnly />
                      </label>
                      <label className="dashboard-account-form__field">
                        <span>Account status</span>
                        <input type="text" value={profile?.accountStatus || ""} readOnly />
                      </label>
                      <div className="dashboard-account-form__actions">
                        <button type="submit" className="dashboard-account-form__submit" disabled={saving}>
                          {saving ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          className="dashboard-account-form__cancel"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {!loading && !loadError && (activeNavId === "dashboard" || activeNavId === "memberships") ? (
        <div id="dashboard-cta" className="dashboard-design-one__impact-strip">
          <LoginCtaSection />
        </div>
      ) : null}
    </section>
  );
}
