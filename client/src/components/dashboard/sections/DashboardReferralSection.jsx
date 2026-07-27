import { useState, useEffect, useRef } from "react";
import { IconCheck, IconCopy, IconShare, IconGift, IconBrandWhatsapp, IconMail, IconDots } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import { formatDiscountLabel, buildReferralUrl, buildWhatsAppShareLink, buildEmailShareLink } from "../../../utils/referralShare.js";
import "../../../styles/dashboard-referral-section.css";
import { devWarn } from "../../../utils/devLog.js";

function formatMoney(minor) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(minor || 0) / 100);
}

export default function DashboardReferralSection() {
  const { t } = useTranslation(["dashboardSections"]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const rewardsRef = useRef(null);
  const shareWrapRef = useRef(null);

  useEffect(() => {
    if (!shareMenuOpen) return;
    function handleClickOutside(e) {
      if (shareWrapRef.current && !shareWrapRef.current.contains(e.target)) setShareMenuOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setShareMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [shareMenuOpen]);

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

  // A referral code isn't tied to one event, so it links to the events listing page —
  // client/src/utils/referralCapture.js captures ?ref= there (or anywhere else it lands)
  // and every checkout flow's code field pre-fills from it.
  const discountLabel = code ? formatDiscountLabel(data.referralCode?.discountType, data.referralCode?.discountValue) : null;
  const shareUrl = code ? buildReferralUrl(code) : "";
  const shareText = code
    ? discountLabel
      ? t("dashboardSections:referralSection.shareTextWithDiscount", { code, discount: discountLabel })
      : t("dashboardSections:referralSection.shareText", { code })
    : "";
  const shareMessage = `${shareText} ${shareUrl}`;

  async function handleNativeShare() {
    try {
      await navigator.share({ title: t("dashboardSections:referralSection.shareTitle"), text: shareText, url: shareUrl });
      setShareMenuOpen(false);
    } catch {
      /* user cancelled the native share sheet — leave the menu open */
    }
  }

  return (
    <section className="dash-referral-section" aria-labelledby="dash-referral-title">
      <div className="dash-referral-section__head">
        <IconGift size={22} aria-hidden />
        <h2 id="dash-referral-title">{t("dashboardSections:referralSection.title")}</h2>
      </div>

      {code ? (
        <>
          <div className="dash-referral-section__code-block">
            <p className="dash-referral-section__code">{code}</p>
            <div className="dash-referral-section__actions">
              <button type="button" onClick={handleCopy} className={`dash-referral-section__btn${copied ? " dash-referral-section__btn--copied" : ""}`}>
                {copied ? (
                  <>
                    <IconCheck size={16} /> {t("dashboardSections:referralSection.copied")}
                  </>
                ) : (
                  <>
                    <IconCopy size={16} /> {t("dashboardSections:referralSection.copyCode")}
                  </>
                )}
              </button>
              <div className="dash-referral-section__share-wrap" ref={shareWrapRef}>
                <button
                  type="button"
                  onClick={() => setShareMenuOpen((v) => !v)}
                  aria-expanded={shareMenuOpen}
                  aria-haspopup="menu"
                  className="dash-referral-section__btn dash-referral-section__btn--share"
                >
                  <IconShare size={16} /> {t("dashboardSections:referralSection.share")}
                </button>
                {shareMenuOpen ? (
                  <div className="dash-referral-section__share-menu" role="menu">
                    <a
                      role="menuitem"
                      href={buildWhatsAppShareLink(shareMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dash-referral-section__share-menu-item"
                      onClick={() => setShareMenuOpen(false)}
                    >
                      <IconBrandWhatsapp size={16} /> {t("dashboardSections:referralSection.shareViaWhatsApp")}
                    </a>
                    <a
                      role="menuitem"
                      href={buildEmailShareLink({ subject: t("dashboardSections:referralSection.shareTitle"), body: shareMessage })}
                      className="dash-referral-section__share-menu-item"
                      onClick={() => setShareMenuOpen(false)}
                    >
                      <IconMail size={16} /> {t("dashboardSections:referralSection.shareViaEmail")}
                    </a>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                        } catch {
                          /* ignore */
                        }
                        setShareMenuOpen(false);
                      }}
                      className="dash-referral-section__share-menu-item"
                    >
                      <IconCopy size={16} /> {t("dashboardSections:referralSection.shareViaCopyLink")}
                    </button>
                    {navigator.share ? (
                      <button type="button" role="menuitem" onClick={handleNativeShare} className="dash-referral-section__share-menu-item">
                        <IconDots size={16} /> {t("dashboardSections:referralSection.shareMoreOptions")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="dash-referral-section__stats">
            <button type="button" className="dash-referral-section__stat dash-referral-section__stat--clickable" onClick={scrollToRewards}>
              <strong>{data.referralUses}</strong>
              <span>{t("dashboardSections:referralSection.referralUses")}</span>
            </button>
            <button type="button" className="dash-referral-section__stat dash-referral-section__stat--clickable" onClick={scrollToRewards}>
              <strong>{formatMoney(data.rewardsEarned)}</strong>
              <span>{t("dashboardSections:referralSection.rewardsEarned")}</span>
            </button>
            <button type="button" className="dash-referral-section__stat dash-referral-section__stat--clickable" onClick={scrollToRewards}>
              <strong>{data.pendingRewards}</strong>
              <span>{t("dashboardSections:referralSection.pendingRewards")}</span>
            </button>
          </div>
        </>
      ) : (
        <p className="dash-referral-section__empty">
          {t("dashboardSections:referralSection.empty")}
        </p>
      )}

      {code ? (
        <div className="dash-referral-section__rewards" ref={rewardsRef}>
          <h3>{t("dashboardSections:referralSection.recentRewards")}</h3>
          {data.rewards?.length > 0 ? (
            data.rewards.map((r) => (
              <div key={r.id} className="dash-referral-section__reward-row">
                <span>{r.buyerEmail || t("dashboardSections:referralSection.anonymousBuyer")}</span>
                {r.isCurrencyReward ? <span>{formatMoney(r.rewardValue)}</span> : null}
                <span className={`dash-referral-section__status dash-referral-section__status--${r.rewardStatus}`}>
                  {r.rewardStatus}
                </span>
              </div>
            ))
          ) : (
            <p className="dash-referral-section__empty">{t("dashboardSections:referralSection.noRewardsYet")}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
