export default function BookingPricePreview({ preview }) {
  if (!preview) return null;

  const { ticketPricing, membershipPricing, combined, comparison, appliedDiscounts, membershipSource } = preview;

  const ttDiscount = appliedDiscounts?.find((d) => d.type === "tickettailor_member");
  const otherDiscounts = appliedDiscounts?.filter((d) => d.type !== "tickettailor_member") || [];

  return (
    <div className="ticket-booking__price-preview">
      <h3>Price preview</h3>

      {ttDiscount ? (
        <div className="ticket-booking__tt-benefit-banner">
          <p className="ticket-booking__tt-benefit-title">TicketTailor Membership Benefit Applied</p>
          <p className="ticket-booking__tt-benefit-body">{ttDiscount.label}</p>
        </div>
      ) : null}

      <div className="ticket-booking__preview-section">
        <p className="ticket-booking__preview-label">Ticket pricing</p>
        <div className="ticket-booking__summary">
          <div><span>Subtotal</span><span>{ticketPricing.subtotal}</span></div>
          {ticketPricing.eventDiscountMinor > 0 ? (
            <div className="ticket-booking__summary-discount">
              <span>Event-specific discount</span>
              <span>-€{(ticketPricing.eventDiscountMinor / 100).toFixed(2)}</span>
            </div>
          ) : null}
          {ttDiscount ? (
            <div className="ticket-booking__summary-discount ticket-booking__summary-discount--tt">
              <span>TicketTailor membership discount</span>
              <span>-€{(ttDiscount.amountMinor / 100).toFixed(2)}</span>
            </div>
          ) : null}
          {!ttDiscount && ticketPricing.memberDiscountMinor > 0 ? (
            <div className="ticket-booking__summary-discount">
              <span>{membershipSource === "TICKETTAILOR" ? "TicketTailor membership discount" : "Member discount"}</span>
              <span>-{ticketPricing.memberDiscount}</span>
            </div>
          ) : null}
          {otherDiscounts.map((d) => (
            <div key={`${d.type}-${d.label}`} className="ticket-booking__summary-discount">
              <span>{d.label}</span>
              <span>-€{(d.amountMinor / 100).toFixed(2)}</span>
            </div>
          ))}
          <div><span>Booking fee</span><span>{ticketPricing.bookingFee}</span></div>
          <div><span>VAT (incl.)</span><span>{ticketPricing.vat}</span></div>
          <div className="ticket-booking__summary-subtotal">
            <span>Ticket total</span><span>{ticketPricing.total}</span>
          </div>
        </div>
      </div>

      {membershipPricing ? (
        <div className="ticket-booking__preview-section">
          <p className="ticket-booking__preview-label">Membership pricing</p>
          <div className="ticket-booking__summary">
            <div><span>{membershipPricing.membershipType}</span><span>{membershipPricing.regularPrice}</span></div>
            {membershipPricing.membershipDiscountMinor > 0 ? (
              <div className="ticket-booking__summary-discount">
                <span>Membership discount</span>
                <span>-€{(membershipPricing.membershipDiscountMinor / 100).toFixed(2)}</span>
              </div>
            ) : null}
            <div className="ticket-booking__summary-subtotal">
              <span>Membership total</span><span>{membershipPricing.discountedPrice}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="ticket-booking__preview-section ticket-booking__preview-section--combined">
        <div className="ticket-booking__summary">
          <div><span>Ticket total</span><span>{combined.ticketTotal}</span></div>
          {membershipPricing ? (
            <div><span>Membership total</span><span>{combined.membershipTotal}</span></div>
          ) : null}
          <div className="ticket-booking__summary-total">
            <span>Total</span><span>{combined.grandTotal}</span>
          </div>
          {combined.totalSavingsMinor > 0 ? (
            <p className="ticket-booking__savings">{combined.savingsMessage}</p>
          ) : null}
        </div>
      </div>

      {comparison?.withMembership ? (
        <div className="ticket-booking__comparison">
          <p className="ticket-booking__preview-label">Savings comparison</p>
          <div className="ticket-booking__comparison-grid">
            <div className="ticket-booking__comparison-col">
              <p className="ticket-booking__comparison-title">Without membership</p>
              <p>{comparison.withoutMembership.grandTotal}</p>
            </div>
            <div className="ticket-booking__comparison-col ticket-booking__comparison-col--highlight">
              <p className="ticket-booking__comparison-title">With membership</p>
              <p>{comparison.withMembership.grandTotal}</p>
              {comparison.withMembership.savingsMinor > 0 ? (
                <p className="ticket-booking__savings">
                  Save {comparison.withMembership.savings}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <p className="ticket-booking__email-note">
        After payment you will receive separate confirmation emails for tickets
        {membershipPricing ? " and membership" : ""}, each with its own PDF download.
      </p>
    </div>
  );
}
