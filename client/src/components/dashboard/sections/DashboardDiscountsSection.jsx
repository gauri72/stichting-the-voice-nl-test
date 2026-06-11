import { useState, useEffect } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import "../../../styles/dashboard-discounts-section.css";

export default function DashboardDiscountsSection() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function loadDiscounts() {
      try {
        const data = await apiFetch("/api/discounts", { headers: authHeaders() });
        setDiscounts(data.discounts || []);
      } catch (err) {
        console.warn("[discounts] Failed to load customer discounts:", err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDiscounts();
  }, []);

  const handleCopy = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.warn("[discounts] Clipboard copy failed:", err.message);
    }
  };

  if (loading || discounts.length === 0) return null;

  return (
    <section className="dash-discounts-section" aria-labelledby="dash-discounts-title">
      <div className="dash-discounts-section__head">
        <h2 id="dash-discounts-title" className="dash-discounts-section__title">
          Available Discounts
        </h2>
      </div>

      <div className="dash-discounts__scroll-container">
        {discounts.map((discount) => {
          const isCopied = copiedId === discount.id;
          return (
            <article key={discount.id} className="dash-discounts__card">
              <div className="dash-discounts__top-block">
                <p className="dash-discounts__value-text">{discount.discountValue}% OFF</p>
              </div>
              <div className="dash-discounts__body">
                <h3 className="dash-discounts__name">{discount.name}</h3>
                <p className="dash-discounts__description" title={discount.description}>
                  {discount.description}
                </p>
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
    </section>
  );
}
