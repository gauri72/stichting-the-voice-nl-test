import { IconCheck } from "@tabler/icons-react";

export default function MembershipPlanCards({
  plans,
  selectedPlanId,
  onSelect,
  purchaseType = "NEW",
}) {
  if (!plans?.length) return null;

  return (
    <div className="ticket-booking__membership-plans">
      <h3>
        {purchaseType === "RENEWAL" ? "Renew your membership" : "Choose a membership plan"}
      </h3>
      <ul className="ticket-booking__plan-list">
        {plans.map((plan) => {
          const selected = selectedPlanId === plan.id;
          return (
            <li
              key={plan.id}
              className={`ticket-booking__plan-card${selected ? " ticket-booking__plan-card--selected" : ""}`}
            >
              <div className="ticket-booking__plan-header">
                <p className="ticket-booking__plan-name">{plan.name}</p>
                <p className="ticket-booking__plan-price">
                  {plan.membershipDiscountMinor > 0 ? (
                    <>
                      <span className="ticket-booking__plan-price-old">{plan.regularPrice}</span>
                      <span>{plan.discountedPrice}</span>
                    </>
                  ) : (
                    plan.regularPrice
                  )}
                  <span className="ticket-booking__plan-period"> / {plan.durationLabel || "1 year"}</span>
                </p>
              </div>
              <p className="ticket-booking__plan-desc">{plan.description}</p>
              <ul className="ticket-booking__plan-benefits">
                {(plan.benefits || []).slice(0, 4).map((b) => (
                  <li key={b}><IconCheck size={14} /> {b}</li>
                ))}
              </ul>
              <button
                type="button"
                className={selected ? "ticket-booking__plan-selected" : "ticket-booking__plan-select"}
                onClick={() => onSelect(plan.id)}
              >
                {selected ? "Selected" : "Select"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
