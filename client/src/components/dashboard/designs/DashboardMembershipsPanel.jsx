import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { FaCheck, FaStar } from "react-icons/fa";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import "../../../styles/dashboard-memberships.css";

function downloadMembershipCard(data) {
  const lines = [
    "STICHTING THE V.O.I.C.E. NL",
    "Membership Card",
    "-------------------",
    `Member: ${data.memberName}`,
    `Plan: ${data.planName}`,
    `Membership No.: ${data.membershipNumber}`,
    `Valid until: ${data.validTo}`,
    "",
    "Present this number at member events."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voice-membership-${data.membershipNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardMembershipsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await apiFetch("/api/dashboard/memberships", { headers: authHeaders() });
      setData(payload);
    } catch (e) {
      setError(e.message || "Could not load membership details.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="dashboard-design-one__loading">Loading memberships…</p>;
  }

  if (error) {
    return (
      <div className="dashboard-design-one__alert" role="alert">
        <p>{error}</p>
        <button type="button" className="dashboard-panel__outline" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!data?.hasMembership) {
    return (
      <div className="dashboard-memberships">
        <h2 className="dashboard-memberships__title">Memberships</h2>
        <div className="dashboard-memberships__empty">
          <p>You do not have an active membership on file yet. Explore our plans to join the community.</p>
          <Link to={data?.joinCta?.href || "/membership"} className="dashboard-memberships__btn dashboard-memberships__btn--primary">
            {data?.joinCta?.label || "View membership plans"}
          </Link>
          {import.meta.env.DEV ? (
            <button
              type="button"
              className="dashboard-memberships__btn dashboard-memberships__btn--outline"
              style={{ marginTop: 12 }}
              onClick={async () => {
                try {
                  await apiFetch("/api/dashboard/memberships/seed", {
                    method: "POST",
                    headers: authHeaders(),
                  });
                  await load();
                } catch (e) {
                  setError(e.message || "Could not create demo membership.");
                }
              }}
            >
              Create demo membership (dev)
            </button>
          ) : null}
        </div>
        {data?.upgrade ? (
          <div className="dashboard-memberships__card">
            <h4>Upgrade Options</h4>
            <p className="dashboard-memberships__upgrade-title">{data.upgrade.title}</p>
            <p className="dashboard-memberships__upgrade-desc">{data.upgrade.description}</p>
            <Link to={data.upgrade.href} className="dashboard-memberships__btn dashboard-memberships__btn--primary">
              {data.upgrade.ctaLabel}
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  const active = data.active;

  return (
    <div className="dashboard-memberships">
      <h2 className="dashboard-memberships__title">Memberships</h2>

      <article className="dashboard-memberships__active-card">
        <span className="dashboard-memberships__active-icon" aria-hidden>
          <FaStar />
        </span>
        <div className="dashboard-memberships__active-body">
          <h3>{active.statusLabel}</h3>
          <p className="dashboard-memberships__plan-name">{active.planName}</p>
          <p className="dashboard-memberships__validity">
            Valid from <strong>{active.validFrom}</strong> to <strong>{active.validTo}</strong>
          </p>
          {active.description ? (
            <p className="dashboard-memberships__active-desc">{active.description}</p>
          ) : null}
        </div>
        <div className="dashboard-memberships__active-actions">
          <Link
            to={data.renewCta?.href || "/membership"}
            className="dashboard-memberships__btn dashboard-memberships__btn--primary"
          >
            {data.renewCta?.label || "Renew Membership"}
          </Link>
          <button
            type="button"
            className="dashboard-memberships__btn dashboard-memberships__btn--outline"
            disabled={!data.downloadCard?.available}
            onClick={() => downloadMembershipCard(data.downloadCard)}
          >
            Download Card
          </button>
        </div>
      </article>

      <h3 className="dashboard-memberships__section-title">Membership Details</h3>
      <div className="dashboard-memberships__table-wrap">
        <table className="dashboard-memberships__table">
          <thead>
            <tr>
              <th scope="col">Plan</th>
              <th scope="col">Status</th>
              <th scope="col">Renewal Date</th>
              <th scope="col">Fee</th>
            </tr>
          </thead>
          <tbody>
            {data.table.map((r, i) => (
              <tr key={`${r.plan}-${i}`}>
                <td>{r.plan}</td>
                <td>
                  <span
                    className={`dashboard-memberships__status-pill ${
                      r.status !== "Active" ? "dashboard-memberships__status-pill--inactive" : ""
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td>{r.renewalDate}</td>
                <td>{r.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-memberships__grid">
        <article className="dashboard-memberships__card">
          <h4>Plan Benefits</h4>
          <ul className="dashboard-memberships__benefits">
            {data.benefits.map((b) => (
              <li key={b.id}>
                <FaCheck aria-hidden />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard-memberships__card">
          <h4>Upgrade Options</h4>
          <p className="dashboard-memberships__upgrade-title">{data.upgrade.title}</p>
          <p className="dashboard-memberships__upgrade-desc">{data.upgrade.description}</p>
          <Link to={data.upgrade.href} className="dashboard-memberships__btn dashboard-memberships__btn--primary">
            {data.upgrade.ctaLabel}
          </Link>
        </article>
      </div>
    </div>
  );
}
