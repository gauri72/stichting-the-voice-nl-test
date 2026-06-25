import { useState, useEffect } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import "../../../styles/dashboard-discounts-section.css";
import { devWarn } from "../../../utils/devLog.js";

function formatExpiry(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardDiscountsSection() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDiscounts() {
      try {
        const data = await apiFetch("/api/dashboard/available-discounts", { headers: authHeaders() });
        if (!active) return;
        setDiscounts(data.discounts || []);
      } catch (err) {
        devWarn("[discounts] Failed to load available discounts:", err.message);
        if (active) setDiscounts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDiscounts();
    return () => {
      active = false;
    };
  }, []);

  const handleCopy = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      devWarn("[discounts] Clipboard copy failed:", err.message);
    }
  };

  if (loading) return null;

  return (
    <section className="dash-discounts-section" aria-labelledby="dash-discounts-title">
      <div className="dash-discounts-section__head">
        <h2 id="dash-discounts-title" className="dash-discounts-section__title">
          Available Discounts
        </h2>
      </div>

      {discounts.length === 0 ? (
        <p className="dash-discounts-section__empty">No active discounts available right now.</p>
      ) : (
        <div className="dash-discounts__scroll-container">
          {discounts.map((discount) => {
            const isCopied = copiedId === discount.id;
            const expiryLabel = formatExpiry(discount.expiresAt);
            const valueLabel =
              discount.discountLabel ||
              (discount.discountType === "fixed_amount"
                ? `€${Number(discount.discountValue).toFixed(2)} off`
                : `${discount.discountValue}% OFF`);

            return (
              <article key={discount.id} className="dash-discounts__card">
                <div className="dash-discounts__top-block">
                  <p className="dash-discounts__value-text">{valueLabel}</p>
                </div>
                <div className="dash-discounts__body">
                  <h3 className="dash-discounts__name">{discount.name}</h3>
                  {discount.description ? (
                    <p className="dash-discounts__description" title={discount.description}>
                      {discount.description}
                    </p>
                  ) : null}
                  {expiryLabel ? (
                    <p className="dash-discounts__expiry">Valid until {expiryLabel}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleCopy(discount.code, discount.id)}
                    className={`dash-discounts__copy-btn${
                      isCopied ? " dash-discounts__copy-btn--copied" : ""
                    }`}
                    aria-live="polite"
                  >
                    {isCopied ? (
                      <>
                        <IconCheck size={16} aria-hidden />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <IconCopy size={16} aria-hidden />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
