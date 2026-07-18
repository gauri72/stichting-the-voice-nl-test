import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import "../../styles/admin-memberships-page.css";
import "../../styles/membership-verification.css";

export default function VerifyMembershipPage() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const data = await apiFetch(`/api/verify-membership/${token}`, {
          headers: { Accept: "application/json" },
        });
        setResult(data);
      } catch (err) {
        setError(err.message || "Verification failed.");
      }
    }
    verify();
  }, [token]);

  const valid = result?.valid;
  const member = result?.member;

  return (
    <div className="membership-verification">
      <div className="membership-verification__card">
        <div className="membership-verification__header">
          <div className={`membership-verification__status-icon${valid ? " is-valid" : " is-invalid"}`}>
            {valid ? "✓" : "!"}
          </div>
          <h1>
            {!member ? "Membership not found" : valid ? "Valid membership" : `Membership ${result?.status || "invalid"}`}
          </h1>
          <p>Stichting The V.O.I.C.E. NL</p>
        </div>
        <div className="membership-verification__body">
          {error ? <p className="membership-verification__error">{error}</p> : null}
          {member ? (
            <dl>
              {[
                ["Member", member.memberName || member.fullName],
                ["Membership ID", member.membershipId],
                ["Type", member.membershipType],
                ["Status", result.status],
                ["Valid until", member.validUntil || member.memberUntilLabel],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value || "—"}</strong>
                </div>
              ))}
            </dl>
          ) : (
            <p className="membership-verification__empty">This QR code does not match any membership in our records.</p>
          )}
        </div>
      </div>
      <p className="membership-verification__footer">© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</p>
    </div>
  );
}
