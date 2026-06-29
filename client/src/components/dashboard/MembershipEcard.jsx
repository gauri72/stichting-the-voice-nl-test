import { forwardRef, useEffect, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import membershipLogo from "../../assets/Dashboard/logo.png";
import memberPassLight from "../../assets/Dashboard/member-pass-light-theme.png";
import { buildQrSrc, resolveMembershipQrSrc } from "./dashboardUtils.js";
import {
  formatEcardDate,
  memberLevelLabel,
} from "../../utils/membershipEcard.js";
import "../../styles/membership-ecard.css";

const MembershipEcard = forwardRef(function MembershipEcard(
  {
    membershipId,
    validUntil,
    planShort,
    planId,
    qrSrc,
    hasMembership,
  },
  ref,
) {
  const level = memberLevelLabel(planShort, planId);
  const untilDisplay = formatEcardDate(validUntil);
  const [qrImageSrc, setQrImageSrc] = useState(() =>
    resolveMembershipQrSrc(qrSrc, membershipId),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQrImageSrc(resolveMembershipQrSrc(qrSrc, membershipId));
  }, [qrSrc, membershipId]);

  async function handleCopyMembershipId() {
    try {
      await navigator.clipboard.writeText(membershipId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!hasMembership) {
    return (
      <article className="voice-ecard voice-ecard--empty" ref={ref}>
        <div className="voice-ecard__empty-body">
          <img className="voice-ecard__logo" src={membershipLogo} alt="" decoding="async" />
          <p className="voice-ecard__empty-title">No Active Membership</p>
          <p className="voice-ecard__empty-copy">
            Join a membership plan to unlock your digital card, QR verification, and wallet
            pass.
          </p>
        </div>
      </article>
    );
  }

  const handleQrError = () => {
    const fallback = buildQrSrc(membershipId);
    if (qrImageSrc !== fallback) {
      setQrImageSrc(fallback);
    }
  };

  return (
    <article className="voice-ecard voice-ecard--template" ref={ref} aria-label="Membership e-card">
      <div className="voice-ecard__canvas">
        <img
          className="voice-ecard__template"
          src={memberPassLight}
          alt=""
          decoding="async"
          draggable={false}
        />

        <div className="voice-ecard__qr-slot">
          <img
            src={qrImageSrc}
            alt={`Membership QR code for ${membershipId}`}
            decoding="async"
            onError={handleQrError}
          />
        </div>

        <button
          type="button"
          className="voice-ecard__field voice-ecard__field--id voice-ecard__field--copyable"
          onClick={handleCopyMembershipId}
          aria-label={`Copy membership ID ${membershipId}`}
        >
          {membershipId}
          <span className="voice-ecard__copy-icon" aria-hidden="true">
            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
          </span>
        </button>
        <p className="voice-ecard__field voice-ecard__field--until">{untilDisplay}</p>
        <p className="voice-ecard__field voice-ecard__field--level">{level}</p>
      </div>
    </article>
  );
});

export default MembershipEcard;
