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
  entry: { Icon: IconTicket, lines: ["Free Event", "Entry"] },
  seats: { Icon: IconSofa, lines: ["Reserved Premium", "Seats"] },
  lounge: { Icon: IconCrown, lines: ["VIP Lounge", "Access"] },
  artist: { Icon: IconHeartHandshake, lines: ["Artist Meet", "& Greet"] },
  partner: { Icon: IconRosetteDiscount, lines: ["Partner", "Discounts"] },
  merch: { Icon: IconShoppingBag, lines: ["Merchandise", "Discounts"] },
  priority: { Icon: IconBolt, lines: ["Priority", "Registration"] },
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
}) {
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
      setActionMessage(error.message || "Something went wrong. Please try again.");
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
          <h2 id="dash-membership-title" className="dash-membership__title">Your Membership Card</h2>
          <section
            className="dash-membership__rect dash-membership__rect--top dash-membership__rect--ecard"
            id={DASHBOARD_MEMBERSHIP_CARD_ID}
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
                <div className="voice-ecard__actions" aria-label="Membership card actions">
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
                    {busyAction === "download" ? "Preparing…" : "Download E-Card"}
                  </button>

                  <button
                    type="button"
                    className="voice-ecard__action voice-ecard__action--google"
                    disabled={!googleEnabled || Boolean(busyAction)}
                    title={
                      googleEnabled
                        ? "Save this membership to Google Wallet"
                        : "Google Wallet is not configured on the server yet"
                    }
                    onClick={() => runAction("google", addMembershipToGoogleWallet)}
                  >
                    <span className="voice-ecard__action-icon" aria-hidden>
                      <IconBrandGoogle size={18} stroke={1.75} />
                    </span>
                    {busyAction === "google" ? "Opening…" : "Add to Google Wallet"}
                  </button>
                </div>
              ) : null}

              {actionMessage ? (
                <p className="voice-ecard__wallet-note" role="alert">
                  {actionMessage}
                </p>
              ) : hasMembership && !googleEnabled ? (
                <p className="voice-ecard__wallet-note">
                  Download your e-card anytime. Google Wallet becomes available once credentials are
                  configured for this environment.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      {showBenefits ? (
        <section className="dash-membership__rect dash-membership__rect--bottom" aria-label="Your Premium Benefits">
          <div className="dash-membership__rect-body">
            <p className="dash-membership__eyebrow dash-membership__eyebrow--benefits">
              <span className="dash-membership__eyebrow-line" aria-hidden />
              <span className="dash-membership__benefits-title dash-grad-text">Your Premium Benefits</span>
              <span className="dash-membership__eyebrow-line" aria-hidden />
            </p>
            <ul className="dash-membership__benefits-list">
              {PREMIUM_BENEFITS.map((benefit) => {
                const config = BENEFIT_CONFIG[benefit.id];
                const Icon = config?.Icon;
                return (
                  <li key={benefit.id}>
                    <span className="dash-membership__benefit-icon" aria-hidden>
                      {Icon ? <Icon size={32} stroke={1.65} /> : null}
                    </span>
                    <TwoLineLabel lines={config?.lines || [benefit.label, ""]} />
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
