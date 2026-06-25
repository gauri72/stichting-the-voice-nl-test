import { useTranslation } from "react-i18next";
import {
  getMembershipMessages,
  sanitizeCustomerDiscountLabel,
} from "../../utils/membershipDisplayLabels.js";

export default function BookingPricePreview({ preview }) {
  const { t } = useTranslation(["checkout"]);
  if (!preview) return null;

  const messagesCopy = getMembershipMessages(t);
  const { ticketPricing, membershipPricing, combined, comparison, appliedDiscounts } = preview;

  const memberDiscount = appliedDiscounts?.find(
    (d) => d.type === "tickettailor_member" || d.type === "member"
  );
  const otherDiscounts =
    appliedDiscounts?.filter((d) => d.type !== "tickettailor_member" && d.type !== "member") || [];

  const memberDiscountLineLabel = memberDiscount
    ? sanitizeCustomerDiscountLabel(memberDiscount.label, t)
    : messagesCopy.discountApplied;

  const memberBenefitTitle =
    memberDiscountLineLabel.includes("Premium") ||
    memberDiscountLineLabel.includes("100%")
      ? messagesCopy.premiumBenefitApplied
      : messagesCopy.discountApplied;

  return (
    <div className="ticket-booking__price-preview">
      <h3>{t("checkout:pricePreview.title")}</h3>

      {memberDiscount ? (
        <div className="ticket-booking__tt-benefit-banner">
          <p className="ticket-booking__tt-benefit-title">{memberBenefitTitle}</p>
          <p className="ticket-booking__tt-benefit-body">{memberDiscountLineLabel}</p>
        </div>
      ) : null}

      {ticketPricing.lineItems?.length > 1 ? (
        <div className="ticket-booking__preview-section">
          <p className="ticket-booking__preview-label">{t("checkout:pricePreview.perTicketBreakdown")}</p>
          <div className="ticket-booking__line-items">
            {ticketPricing.lineItems.map((line) => (
              <div key={line.ticketTypeId} className="ticket-booking__line-item">
                <div className="ticket-booking__line-item-head">
                  <span>{line.ticketTypeName} × {line.quantity}</span>
                  <span>
                    {line.discountAmountMinor > 0 ? (
                      <>
                        <span className="ticket-booking__line-item-original">€{(line.originalPriceMinor / 100).toFixed(2)}</span>{" "}
                        {line.finalPrice}
                      </>
                    ) : (
                      `€${(line.originalPriceMinor / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                {line.memberLabel || line.codeLabel ? (
                  <p className="ticket-booking__line-item-discount-label">
                    {[line.memberLabel, line.codeLabel].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="ticket-booking__preview-section">
        <p className="ticket-booking__preview-label">{t("checkout:pricePreview.ticketPricing")}</p>
        <div className="ticket-booking__summary">
          <div><span>{t("checkout:pricePreview.subtotal")}</span><span>{ticketPricing.subtotal}</span></div>
          {ticketPricing.eventDiscountMinor > 0 ? (
            <div className="ticket-booking__summary-discount">
              <span>{t("checkout:pricePreview.eventDiscount")}</span>
              <span>-€{(ticketPricing.eventDiscountMinor / 100).toFixed(2)}</span>
            </div>
          ) : null}
          {memberDiscount ? (
            <div className="ticket-booking__summary-discount ticket-booking__summary-discount--tt">
              <span>{memberDiscountLineLabel}</span>
              <span>-€{(memberDiscount.amountMinor / 100).toFixed(2)}</span>
            </div>
          ) : null}
          {!memberDiscount && ticketPricing.memberDiscountMinor > 0 ? (
            <div className="ticket-booking__summary-discount">
              <span>{messagesCopy.discountApplied}</span>
              <span>-{ticketPricing.memberDiscount}</span>
            </div>
          ) : null}
          {otherDiscounts.map((d) => (
            <div key={`${d.type}-${d.label}`} className="ticket-booking__summary-discount">
              <span>{sanitizeCustomerDiscountLabel(d.label, t)}</span>
              <span>-€{(d.amountMinor / 100).toFixed(2)}</span>
            </div>
          ))}
          <div><span>{t("checkout:pricePreview.bookingFee")}</span><span>{ticketPricing.bookingFee}</span></div>
          <div><span>{t("checkout:pricePreview.vat")}</span><span>{ticketPricing.vat}</span></div>
          <div className="ticket-booking__summary-subtotal">
            <span>{t("checkout:pricePreview.ticketTotal")}</span><span>{ticketPricing.total}</span>
          </div>
        </div>
      </div>

      {membershipPricing ? (
        <div className="ticket-booking__preview-section">
          <p className="ticket-booking__preview-label">{t("checkout:pricePreview.membershipPricing")}</p>
          <div className="ticket-booking__summary">
            <div><span>{membershipPricing.membershipType}</span><span>{membershipPricing.regularPrice}</span></div>
            {membershipPricing.membershipDiscountMinor > 0 ? (
              <div className="ticket-booking__summary-discount">
                <span>{t("checkout:pricePreview.membershipDiscount")}</span>
                <span>-€{(membershipPricing.membershipDiscountMinor / 100).toFixed(2)}</span>
              </div>
            ) : null}
            <div className="ticket-booking__summary-subtotal">
              <span>{t("checkout:pricePreview.membershipTotal")}</span><span>{membershipPricing.discountedPrice}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="ticket-booking__preview-section ticket-booking__preview-section--combined">
        <div className="ticket-booking__summary">
          <div><span>{t("checkout:pricePreview.ticketTotal")}</span><span>{combined.ticketTotal}</span></div>
          {membershipPricing ? (
            <div><span>{t("checkout:pricePreview.membershipTotal")}</span><span>{combined.membershipTotal}</span></div>
          ) : null}
          <div className="ticket-booking__summary-total">
            <span>{t("checkout:pricePreview.total")}</span><span>{combined.grandTotal}</span>
          </div>
          {combined.totalSavingsMinor > 0 ? (
            <p className="ticket-booking__savings">{combined.savingsMessage}</p>
          ) : null}
        </div>
      </div>

      {comparison?.withMembership ? (
        <div className="ticket-booking__comparison">
          <p className="ticket-booking__preview-label">{t("checkout:pricePreview.savingsComparison")}</p>
          <div className="ticket-booking__comparison-grid">
            <div className="ticket-booking__comparison-col">
              <p className="ticket-booking__comparison-title">{t("checkout:pricePreview.withoutMembership")}</p>
              <p>{comparison.withoutMembership.grandTotal}</p>
            </div>
            <div className="ticket-booking__comparison-col ticket-booking__comparison-col--highlight">
              <p className="ticket-booking__comparison-title">{t("checkout:pricePreview.withMembership")}</p>
              <p>{comparison.withMembership.grandTotal}</p>
              {comparison.withMembership.savingsMinor > 0 ? (
                <p className="ticket-booking__savings">
                  {t("checkout:pricePreview.save", { amount: comparison.withMembership.savings })}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <p className="ticket-booking__email-note">
        {t("checkout:pricePreview.emailNote", {
          membershipSuffix: membershipPricing ? t("checkout:pricePreview.andMembership") : "",
        })}
      </p>
    </div>
  );
}
