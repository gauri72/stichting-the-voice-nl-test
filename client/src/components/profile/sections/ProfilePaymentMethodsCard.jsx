import { FaCcAmex, FaCcMastercard, FaCcVisa, FaLock } from "react-icons/fa";
import { IconChevronRight, IconCreditCard, IconDotsVertical } from "@tabler/icons-react";
import { MOCK_PAYMENT_METHODS } from "../profileUtils.js";

function CardBrandMark({ brand }) {
  if (brand === "visa") {
    return (
      <span className="profile-pay__brand profile-pay__brand--visa" aria-hidden>
        <FaCcVisa />
      </span>
    );
  }
  if (brand === "mastercard") {
    return (
      <span className="profile-pay__brand profile-pay__brand--mastercard" aria-hidden>
        <FaCcMastercard />
      </span>
    );
  }
  return (
    <span className="profile-pay__brand profile-pay__brand--amex" aria-hidden>
      <FaCcAmex />
    </span>
  );
}

export default function ProfilePaymentMethodsCard() {
  return (
    <article className="profile-card profile-card--payment">
      <button type="button" className="profile-card__head profile-card__head--interactive">
        <span className="profile-card__icon" aria-hidden>
          <IconCreditCard size={20} stroke={1.75} />
        </span>
        <span className="profile-card__head-copy">
          <strong className="profile-card__title">Payment Methods</strong>
          <span className="profile-card__subtitle">Manage your saved payment methods.</span>
        </span>
        <IconChevronRight className="profile-card__chevron" size={18} stroke={2} aria-hidden />
      </button>

      <div className="profile-card__body profile-card__body--payment">
        <div className="profile-pay__add">
          <button type="button" className="profile-btn profile-btn--outline">
            + Add New Card
          </button>
        </div>

        <ul className="profile-pay__list">
        {MOCK_PAYMENT_METHODS.map((card) => (
          <li key={card.id} className="profile-pay__item">
            <CardBrandMark brand={card.brand} />
            <div className="profile-pay__copy">
              <strong>
                {card.label} •••• {card.last4}
              </strong>
              <span>Expires {card.expires}</span>
            </div>
            {card.isDefault ? (
              <span className="profile-pay__badge">Default</span>
            ) : (
              <button type="button" className="profile-btn profile-btn--outline profile-btn--compact">
                Set as Default
              </button>
            )}
            <button type="button" className="profile-pay__menu" aria-label={`Options for ${card.label}`}>
              <IconDotsVertical size={18} stroke={1.75} />
            </button>
          </li>
        ))}
        </ul>

        <p className="profile-pay__secure">
          <FaLock aria-hidden />
          Your payment information is encrypted and secure
        </p>
      </div>
    </article>
  );
}
