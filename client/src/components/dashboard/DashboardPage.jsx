import { Link } from "react-router-dom";
import { FaDonate, FaIdCard, FaSignOutAlt, FaUser } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import "../../styles/dashboard.css";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page" id="dashboard-navbar-top">
      <section className="dashboard-hero">
        <div className="dashboard-hero__inner">
          <p className="dashboard-hero__eyebrow">My Account</p>
          <h1>
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="dashboard-hero__intro">
            Your account is active. Manage your membership, donations, and profile from here.
          </p>
          <p className="dashboard-hero__email">{user?.email}</p>
        </div>
        <button type="button" className="dashboard-hero__logout" onClick={logout}>
          <FaSignOutAlt aria-hidden />
          Log Out
        </button>
      </section>

      <section className="dashboard-grid" aria-label="Account overview">
        <article className="dashboard-card">
          <FaUser className="dashboard-card__icon" aria-hidden />
          <h2>Profile</h2>
          <p>View and update your personal details.</p>
          <span className="dashboard-card__badge">Coming soon</span>
        </article>

        <article className="dashboard-card">
          <FaIdCard className="dashboard-card__icon" aria-hidden />
          <h2>Membership</h2>
          <p>See your membership status and event registrations.</p>
          <Link to="/membership" className="dashboard-card__action">
            View membership
          </Link>
        </article>

        <article className="dashboard-card">
          <FaDonate className="dashboard-card__icon" aria-hidden />
          <h2>Donations</h2>
          <p>Review your donation history and receipts.</p>
          <Link to="/donate" className="dashboard-card__action">
            Make a donation
          </Link>
        </article>
      </section>
    </div>
  );
}
