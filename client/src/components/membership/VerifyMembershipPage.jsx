import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../utils/api.js";
import "../../styles/admin-memberships-page.css";
import "../../styles/membership-verification.css";

export default function VerifyMembershipPage() {
  const { t } = useTranslation(["membership", "common"]);
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
        setError(err.message || t("membership:verifyMembershipPage.verificationFailed"));
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
            {!member
              ? t("membership:verifyMembershipPage.notFound")
              : valid
              ? t("membership:verifyMembershipPage.valid")
              : t("membership:verifyMembershipPage.statusHeading", {
                  status: result?.status || t("membership:verifyMembershipPage.statusFallback"),
                })}
          </h1>
          <p>Stichting The V.O.I.C.E. NL</p>
        </div>
        <div className="membership-verification__body">
          {error ? <p className="membership-verification__error">{error}</p> : null}
          {member ? (
            <dl>
              {[
                [t("membership:verifyMembershipPage.fields.member"), member.memberName || member.fullName],
                [t("membership:verifyMembershipPage.fields.membershipId"), member.membershipId],
                [t("membership:verifyMembershipPage.fields.type"), member.membershipType],
                [t("membership:verifyMembershipPage.fields.status"), result.status],
                [t("membership:verifyMembershipPage.fields.validUntil"), member.validUntil || member.memberUntilLabel],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value || "—"}</strong>
                </div>
              ))}
            </dl>
          ) : (
            <p className="membership-verification__empty">{t("membership:verifyMembershipPage.invalidQrMessage")}</p>
          )}
        </div>
      </div>
      <p className="membership-verification__footer">{t("common:footer.copyrightText")}</p>
    </div>
  );
}
