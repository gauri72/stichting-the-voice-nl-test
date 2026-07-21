import { useRef, useState } from "react";
import {
  IconBolt,
  IconBrandGoogle,
  IconCrown,
  IconDownload,
  IconHeartHandshake,
  IconRosetteDiscount,
  IconShoppingBag,
  IconSofa,
  IconTicket,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import MembershipEcard from "../MembershipEcard.jsx";
import {
  addMembershipToGoogleWallet,
  downloadMembershipEcard,
} from "../../../utils/membershipEcard.js";
import {
  DASHBOARD_MEMBERSHIP_CARD_ID,
  PREMIUM_BENEFITS,
} from "../dashboardUtils.js";
import "../../../styles/dashboard-membership-card-section.css";

const BENEFIT_CONFIG = {
  entry: { Icon: IconTicket, key: "entry" },
  seats: { Icon: IconSofa, key: "seats" },
  lounge: { Icon: IconCrown, key: "lounge" },
  artist: { Icon: IconHeartHandshake, key: "artist" },
  partner: { Icon: IconRosetteDiscount, key: "partner" },
  merch: { Icon: IconShoppingBag, key: "merch" },
  priority: { Icon: IconBolt, key: "priority" },
};

function TwoLineLabel({ lines }) {
  return (
    <span className="dash-membership__benefit-label">
      <span>{lines[0]}</span>
      <span>{lines[1]}</span>
    </span>
  );
}

export default function DashboardMembershipCardSection({
  planShort,
  planId,
  membershipId,
  memberSince,
  validUntil,
  validFrom,
  hasMembership,
  qrSrc,
  wallet,
  showCard = true,
  showBenefits = true,
  compact = false,
  sectionId = DASHBOARD_MEMBERSHIP_CARD_ID,
}) {
  const { t } = useTranslation(["dashboardSections"]);
  const cardRef = useRef(null);
  const [actionMessage, setActionMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const googleEnabled = Boolean(wallet?.googleAvailable);

  const runAction = async (actionId, task) => {
    setActionMessage("");
    setBusyAction(actionId);
    try {
      await task();
    } catch (error) {
      setActionMessage(error.message || t("dashboardSections:membershipCardSection.genericError"));
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className={`dash-membership-group${compact ? " dash-membership-group--compact" : ""}`}>
      {showCard ? (
        <>
          {/* Heading rendered outside .dash-membership__rect--top on purpose
              — that element sets its own container-type:inline-size for the
              e-card's internal QR/field sizing, which would make this
              heading's cqw units resolve against the card's own (narrower)
              width instead of the same outer container My Bookings' heading
              uses, throwing the two out of sync. */}
          <h2 id="dash-membership-title" className="dash-membership__title">
            {t("dashboardSections:membershipCardSection.title")}
          </h2>
          <section
            className="dash-membership__rect dash-membership__rect--top dash-membership__rect--ecard"
            id={sectionId || undefined}
            aria-labelledby="dash-membership-title"
          >
            <div className="dash-membership__rect-body">
              <MembershipEcard
                ref={cardRef}
                membershipId={membershipId}
                memberSince={memberSince}
                validUntil={validUntil}
                validFrom={validFrom}
                planShort={planShort}
                planId={planId}
                qrSrc={qrSrc}
                hasMembership={hasMembership}
              />

              {hasMembership ? (
                <div className="voice-ecard__actions" aria-label={t("dashboardSections:membershipCardSection.actionsAriaLabel")}>
                  <button
                    type="button"
                    className="voice-ecard__action"
                    disabled={Boolean(busyAction)}
                    onClick={() =>
                      runAction("download", () => downloadMembershipEcard(cardRef.current, membershipId))
                    }
                  >
                    <span className="voice-ecard__action-icon" aria-hidden>
                      <IconDownload size={18} stroke={1.75} />
                    </span>
                    {busyAction === "download"
                      ? t("dashboardSections:membershipCardSection.preparing")
                      : t("dashboardSections:membershipCardSection.downloadEcard")}
                  </button>

                  <button
                    type="button"
                    className="voice-ecard__action voice-ecard__action--google"
                    disabled={!googleEnabled || Boolean(busyAction)}
                    title={
                      googleEnabled
                        ? t("dashboardSections:membershipCardSection.googleWalletAvailableTitle")
                        : t("dashboardSections:membershipCardSection.googleWalletUnavailableTitle")
                    }
                    onClick={() => runAction("google", addMembershipToGoogleWallet)}
                  >
                    <span className="voice-ecard__action-icon" aria-hidden>
                      <IconBrandGoogle size={18} stroke={1.75} />
                    </span>
                    {busyAction === "google"
                      ? t("dashboardSections:membershipCardSection.opening")
                      : t("dashboardSections:membershipCardSection.addToGoogleWallet")}
                  </button>
                </div>
              ) : null}

              {actionMessage ? (
                <p className="voice-ecard__wallet-note" role="alert">
                  {actionMessage}
                </p>
              ) : hasMembership && !googleEnabled ? (
                <p className="voice-ecard__wallet-note">
                  {t("dashboardSections:membershipCardSection.walletNote")}
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {showBenefits ? (
        <section
          className="dash-membership__rect dash-membership__rect--bottom"
          aria-label={t("dashboardSections:membershipCardSection.benefitsAriaLabel")}
        >
          <div className="dash-membership__rect-body">
            <p className="dash-membership__eyebrow dash-membership__eyebrow--benefits">
              <span className="dash-membership__eyebrow-line" aria-hidden />
              <span className="dash-membership__benefits-title dash-grad-text">
                {t("dashboardSections:membershipCardSection.benefitsTitle")}
              </span>
              <span className="dash-membership__eyebrow-line" aria-hidden />
            </p>
            <ul className="dash-membership__benefits-list">
              {PREMIUM_BENEFITS.map((benefit) => {
                const config = BENEFIT_CONFIG[benefit.id];
                const Icon = config?.Icon;
                const lines = config?.key
                  ? [
                      t(`dashboardSections:membershipCardSection.benefits.${config.key}.line1`),
                      t(`dashboardSections:membershipCardSection.benefits.${config.key}.line2`),
                    ]
                  : [benefit.label, ""];
                return (
                  <li key={benefit.id}>
                    <span className="dash-membership__benefit-icon" aria-hidden>
                      {Icon ? <Icon size={32} stroke={1.65} /> : null}
                    </span>
                    <TwoLineLabel lines={lines} />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
