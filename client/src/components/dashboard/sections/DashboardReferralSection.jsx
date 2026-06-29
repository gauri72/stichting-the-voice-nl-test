import { useState, useEffect, useRef } from "react";
import { IconCheck, IconCopy, IconShare, IconGift } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import "../../../styles/dashboard-referral-section.css";
import { devWarn } from "../../../utils/devLog.js";

export default function DashboardReferralSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const rewardsRef = useRef(null);

  function scrollToRewards() {
    rewardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch("/api/dashboard/referrals", { headers: authHeaders() });
        if (result.enabled) setData(result.referral);
      } catch (err) {
        devWarn("[referrals] Failed to load:", err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) return null;

  const code = data.referralCode?.code;

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function handleShare() {
    if (!code) return;
    const shareData = {
      title: "Join Stichting The V.O.I.C.E. NL",
      text: `Use my referral code ${code} for a discount!`,
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  return (
    <section className="dash-referral-section" aria-labelledby="dash-referral-title">
      <div className="dash-referral-section__head">
        <IconGift size={22} aria-hidden />
        <h2 id="dash-referral-title">My Referral Code</h2>
      </div>

      {code ? (
        <>
          <div className="dash-referral-section__code-block">
            <p className="dash-referral-section__code">{code}</p>
            <div className="dash-referral-section__actions">
              <button type="button" onClick={handleCopy} className={`dash-referral-section__btn${copied ? " dash-referral-section__btn--copied" : ""}`}>
                {copied ? <><IconCheck size={16} /> Copied!</> : <><IconCopy size={16} /> Copy Code</>}
              </button>
              <button type="button" onClick={handleShare} className="dash-referral-section__btn dash-referral-section__btn--share">
                <IconShare size={16} /> Share
              </button>
            </div>
          </div>

          <div className="dash-referral-section__stats">
            <button type="button" className="dash-referral-section__stat dash-referral-section__stat--clickable" onClick={scrollToRewards}>
              <strong>{data.referralUses}</strong>
              <span>Referral Uses</span>
            </button>
            <button type="button" className="dash-referral-section__stat dash-referral-section__stat--clickable" onClick={scrollToRewards}>
              <strong>{data.rewardsEarned}</strong>
              <span>Rewards Earned</span>
            </button>
            <button type="button" className="dash-referral-section__stat dash-referral-section__stat--clickable" onClick={scrollToRewards}>
              <strong>{data.pendingRewards}</strong>
              <span>Pending Rewards</span>
            </button>
          </div>
        </>
      ) : (
        <p className="dash-referral-section__empty">
          Invite friends to V.O.I.C.E. NL and earn rewards when they join — contact us to get your referral code.
        </p>
      )}

      {code ? (
        <div className="dash-referral-section__rewards" ref={rewardsRef}>
          <h3>Recent Rewards</h3>
          {data.rewards?.length > 0 ? (
            data.rewards.map((r) => (
              <div key={r.id} className="dash-referral-section__reward-row">
                <span>{r.buyerEmail || "Anonymous buyer"}</span>
                <span className={`dash-referral-section__status dash-referral-section__status--${r.rewardStatus}`}>
                  {r.rewardStatus}
                </span>
              </div>
            ))
          ) : (
            <p className="dash-referral-section__empty">No referral activity yet — share your code to get started.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
