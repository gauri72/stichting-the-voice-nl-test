import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck, FaStar, FaTimes } from "react-icons/fa";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import {
  getPlanBenefitsForMatrix,
  getUpgradeOptionDisplay,
  inferPlanIdFromTitle,
} from "../../../config/membershipMatrix.js";
import "../../../styles/dashboard-memberships.css";

const MEMBERSHIP_MATRIX_HREF = "/membership#membership-matrix";

function downloadMembershipCard(card) {
  if (!card?.available) return;
  const lines = [
    "STICHTING THE V.O.I.C.E. NL",
    "Membership Card",
    "-------------------",
    `Member: ${card.memberName}`,
    `Plan: ${card.planName}`,
    `Membership No.: ${card.membershipNumber}`,
    `Valid until: ${card.validTo}`,
    "",
    "Present this number at member events.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `voice-membership-${card.membershipNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function resolvePlanId(active) {
  if (active?.planId) return active.planId;
  return inferPlanIdFromTitle(active?.planNameAccent || active?.planName);
}

function MatrixBenefitIcon({ value }) {
  if (value === "included") return <FaCheck aria-hidden className="dashboard-memberships__benefit-icon--ok" />;
  if (value === "not-included") return <FaTimes aria-hidden className="dashboard-memberships__benefit-icon--no" />;
  return <FaCheck aria-hidden />;
}

function PlanBenefitsCard({ benefits }) {
  return (
    <article className="dashboard-memberships__card">
      <h3 className="dashboard-memberships__card-title">Plan Benefits</h3>
      {benefits.length > 0 ? (
        <ul className="dashboard-memberships__benefits">
          {benefits.map((b) => (
            <li key={b.id}>
              <MatrixBenefitIcon value={b.value} />
              <span>{b.feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-memberships__card-empty">Benefits for your plan are listed on the membership page.</p>
      )}
    </article>
  );
}

function UpgradeOptionsCard({ upgrade }) {
  if (!upgrade) return null;

  return (
    <article className="dashboard-memberships__card dashboard-memberships__card--upgrade">
      <h3 className="dashboard-memberships__card-title">Upgrade Options</h3>
      <p className="dashboard-memberships__upgrade-title">{upgrade.title}</p>
      <p className="dashboard-memberships__upgrade-desc">{upgrade.description}</p>
      <Link to={upgrade.href || MEMBERSHIP_MATRIX_HREF} className="dashboard-memberships__btn dashboard-memberships__btn--primary">
        {upgrade.ctaLabel}
      </Link>
    </article>
  );
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

  const hasMembership = Boolean(data?.hasMembership);
  const planId = useMemo(() => (hasMembership ? resolvePlanId(data?.active) : null), [data, hasMembership]);

  const benefits = useMemo(() => (planId ? getPlanBenefitsForMatrix(planId) : []), [planId]);

  const upgrade = useMemo(
    () => getUpgradeOptionDisplay(planId, hasMembership),
    [planId, hasMembership]
  );

  if (loading) {
    return (
      <div className="dashboard-memberships">
        <p className="dashboard-memberships__loading">Loading your membership…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-memberships">
        <h2 className="dashboard-memberships__title">Memberships</h2>
        <div className="dashboard-memberships__notice dashboard-memberships__notice--error" role="alert">
          <p>{error}</p>
          <button type="button" className="dashboard-memberships__btn dashboard-memberships__btn--outline" onClick={load}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!hasMembership) {
    return (
      <div className="dashboard-memberships">
        <h2 className="dashboard-memberships__title">Memberships</h2>

        <div className="dashboard-memberships__empty">
          <p>We could not find a membership linked to your login email.</p>
          <Link
            to={data?.joinCta?.href || "/membership"}
            className="dashboard-memberships__btn dashboard-memberships__btn--primary"
          >
            {data?.joinCta?.label || "View membership plans"}
          </Link>
        </div>

        <div className="dashboard-memberships__grid">
          <article className="dashboard-memberships__card">
            <h3 className="dashboard-memberships__card-title">Plan Benefits</h3>
            <p className="dashboard-memberships__card-empty">
              Join a membership to unlock event access, reserved seating, and partner benefits.
            </p>
          </article>
          <UpgradeOptionsCard upgrade={upgrade} />
        </div>
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
          <p className="dashboard-memberships__status-kicker">{active.statusLabel}</p>
          <p className="dashboard-memberships__plan-name">{active.planNameAccent || active.planName}</p>
          <p className="dashboard-memberships__validity">
            Valid from <strong>{active.validFrom}</strong> to <strong>{active.validTo}</strong>
          </p>
          {active.description ? (
            <p className="dashboard-memberships__active-desc">{active.description}</p>
          ) : null}
        </div>
        <div className="dashboard-memberships__active-actions">
          <Link
            to={data.renewCta?.href || MEMBERSHIP_MATRIX_HREF}
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

      <section className="dashboard-memberships__section" aria-labelledby="membership-details-heading">
        <h3 id="membership-details-heading" className="dashboard-memberships__section-title">
          Membership Details
        </h3>
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
              {data.table.map((row) => (
                <tr key={`${row.orderId || row.plan}-${row.renewalDateIso || row.renewalDate}`}>
                  <td data-label="Plan">{row.plan}</td>
                  <td data-label="Status">
                    <span
                      className={`dashboard-memberships__status-pill ${
                        row.status !== "Active" ? "dashboard-memberships__status-pill--muted" : ""
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td data-label="Renewal Date">{row.renewalDate}</td>
                  <td data-label="Fee">{row.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dashboard-memberships__grid">
        <PlanBenefitsCard benefits={benefits} />
        <UpgradeOptionsCard upgrade={upgrade} />
      </div>
    </div>
  );
}
