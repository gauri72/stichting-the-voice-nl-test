import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api.js";
import "../../styles/admin-memberships-page.css";

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
    <div style={{ minHeight: "100vh", background: "#030712", color: "#fff", padding: "48px 16px" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", background: "#06101f", borderRadius: 18, border: "1px solid rgba(62,198,212,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "28px 24px", textAlign: "center", background: "linear-gradient(135deg,#06101f,#0b2447)" }}>
          <div style={{ width: 64, height: 64, lineHeight: "64px", borderRadius: "50%", margin: "0 auto 12px", background: valid ? "#3ecf9a" : "#ef4444", fontSize: 28 }}>
            {valid ? "✓" : "!"}
          </div>
          <h1 style={{ margin: 0, fontSize: 22 }}>
            {!member ? "Membership not found" : valid ? "Valid membership" : `Membership ${result?.status || "invalid"}`}
          </h1>
          <p style={{ margin: "8px 0 0", color: "#8a9bb5", fontSize: 14 }}>Stichting The V.O.I.C.E. NL</p>
        </div>
        <div style={{ padding: "22px 24px" }}>
          {error ? <p style={{ color: "#f87171" }}>{error}</p> : null}
          {member ? (
            <dl style={{ margin: 0 }}>
              {[
                ["Member", member.memberName || member.fullName],
                ["Membership ID", member.membershipId],
                ["Type", member.membershipType],
                ["Status", result.status],
                ["Valid until", member.validUntil || member.memberUntilLabel],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#8a9bb5" }}>{label}</span>
                  <strong>{value || "—"}</strong>
                </div>
              ))}
            </dl>
          ) : (
            <p style={{ color: "#8a9bb5" }}>This QR code does not match any membership in our records.</p>
          )}
        </div>
      </div>
      <p style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "#6b7d94" }}>© 2026 Stichting The V.O.I.C.E. NL. All rights reserved.</p>
    </div>
  );
}
