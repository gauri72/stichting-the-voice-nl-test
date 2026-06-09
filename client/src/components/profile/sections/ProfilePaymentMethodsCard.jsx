import { useCallback, useEffect, useState } from "react";
import { FaCcAmex, FaCcMastercard, FaCcVisa, FaLock } from "react-icons/fa";
import { IconCreditCard, IconTrash } from "@tabler/icons-react";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import { getStripePromise, STRIPE_PUBLISHABLE_KEY } from "../../../utils/stripeClient.js";
import { completeSetupReturn, isSetupReturnUrl } from "../../../utils/stripePayment.js";
import ProfileAddPaymentMethod from "./ProfileAddPaymentMethod.jsx";

function BrandMark({ method }) {
  if (method.type === "card") {
    if (method.brand === "visa") {
      return (
        <span className="profile-pay__brand profile-pay__brand--visa" aria-hidden>
          <FaCcVisa />
        </span>
      );
    }
    if (method.brand === "mastercard") {
      return (
        <span className="profile-pay__brand profile-pay__brand--mastercard" aria-hidden>
          <FaCcMastercard />
        </span>
      );
    }
    if (method.brand === "amex") {
      return (
        <span className="profile-pay__brand profile-pay__brand--amex" aria-hidden>
          <FaCcAmex />
        </span>
      );
    }
    return (
      <span className="profile-pay__brand" aria-hidden>
        <IconCreditCard size={22} stroke={1.6} />
      </span>
    );
  }
  if (method.type === "ideal") {
    return <span className="profile-pay__brand profile-pay__brand--ideal" aria-hidden>iDEAL</span>;
  }
  if (method.type === "sepa_debit") {
    return <span className="profile-pay__brand profile-pay__brand--sepa" aria-hidden>SEPA</span>;
  }
  return (
    <span className="profile-pay__brand" aria-hidden>
      <IconCreditCard size={22} stroke={1.6} />
    </span>
  );
}

function brandTitle(brand) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function walletLabel(wallet) {
  if (wallet === "apple_pay") return "Apple Pay";
  if (wallet === "google_pay") return "Google Pay";
  return "";
}

function describeMethod(method) {
  if (method.type === "card") {
    const wallet = walletLabel(method.wallet);
    return {
      primary: `${brandTitle(method.brand)} •••• ${method.last4}`,
      secondary: [
        method.expMonth && method.expYear
          ? `Expires ${String(method.expMonth).padStart(2, "0")}/${String(method.expYear).slice(-2)}`
          : "",
        wallet,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }
  if (method.type === "sepa_debit") {
    return { primary: `SEPA Direct Debit •••• ${method.last4}`, secondary: "From iDEAL / bank account" };
  }
  if (method.type === "ideal") {
    return { primary: "iDEAL", secondary: method.bank ? method.bank.toUpperCase() : "Dutch bank" };
  }
  if (method.type === "paypal") {
    return { primary: "PayPal", secondary: method.email || "" };
  }
  return { primary: method.label || method.brand, secondary: "" };
}

export default function ProfilePaymentMethodsCard() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/payment-methods", { headers: authHeaders() });
      setMethods(data?.methods || []);
    } catch (e) {
      setError(e.message || "Could not load your payment methods.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Resume after a redirect-based method (e.g. iDEAL) returns to this page.
  useEffect(() => {
    if (!STRIPE_PUBLISHABLE_KEY || !isSetupReturnUrl()) return;
    const promise = getStripePromise();
    if (!promise) return;
    promise.then(async (stripe) => {
      if (!stripe) return;
      await completeSetupReturn(stripe, {
        onSuccess: async (setupIntent) => {
          try {
            await apiFetch("/api/payment-methods/confirm-setup", {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ setupIntentId: setupIntent.id }),
            });
          } catch {
            // Listing still reflects the attached method.
          }
          setStatus("Your payment method has been saved.");
          await load();
        },
        onError: (msg) => setError(msg),
      });
    });
  }, [load]);

  async function handleSetDefault(id) {
    setBusyId(id);
    setError("");
    setStatus("");
    try {
      const data = await apiFetch(`/api/payment-methods/${id}/default`, {
        method: "PUT",
        headers: authHeaders(),
      });
      setMethods(data?.methods || []);
      setStatus("Default payment method updated.");
    } catch (e) {
      setError(e.message || "Could not update your default payment method.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this payment method?")) return;
    setBusyId(id);
    setError("");
    setStatus("");
    try {
      const data = await apiFetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setMethods(data?.methods || []);
      setStatus("Payment method removed.");
    } catch (e) {
      setError(e.message || "Could not remove this payment method.");
    } finally {
      setBusyId("");
    }
  }

  async function handleSaved() {
    setAdding(false);
    setStatus("Your payment method has been saved.");
    await load();
  }

  return (
    <article className="profile-card profile-card--payment">
      <div className="profile-card__head">
        <span className="profile-card__icon" aria-hidden>
          <IconCreditCard size={20} stroke={1.75} />
        </span>
        <span className="profile-card__head-copy">
          <strong className="profile-card__title">Payment Methods</strong>
          <span className="profile-card__subtitle">
            iDEAL, cards, Apple Pay &amp; Google Pay — saved securely with Stripe.
          </span>
        </span>
        {!adding ? (
          <button
            type="button"
            className="profile-btn profile-btn--compact"
            onClick={() => {
              setStatus("");
              setError("");
              setAdding(true);
            }}
          >
            + Add
          </button>
        ) : null}
      </div>

      <div className="profile-card__body profile-card__body--payment">
        {adding ? (
          <ProfileAddPaymentMethod onCancel={() => setAdding(false)} onSaved={handleSaved} />
        ) : null}

        {status ? (
          <p className="profile-form__success" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="profile-form__error" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="profile-pay__hint">Loading your payment methods…</p>
        ) : null}

        {!loading && !adding && methods.length === 0 ? (
          <p className="profile-pay__hint">
            You have no saved payment methods yet. Add one to check out faster next time.
          </p>
        ) : null}

        {methods.length > 0 ? (
          <ul className="profile-pay__list">
            {methods.map((method) => {
              const info = describeMethod(method);
              return (
                <li key={method.id} className="profile-pay__item">
                  <BrandMark method={method} />
                  <div className="profile-pay__copy">
                    <strong>{info.primary}</strong>
                    {info.secondary ? <span>{info.secondary}</span> : null}
                  </div>
                  {method.isDefault ? (
                    <span className="profile-pay__badge">Default</span>
                  ) : (
                    <button
                      type="button"
                      className="profile-btn profile-btn--outline profile-btn--compact"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={busyId === method.id}
                    >
                      {busyId === method.id ? "…" : "Set Default"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="profile-pay__menu"
                    aria-label={`Remove ${info.primary}`}
                    onClick={() => handleDelete(method.id)}
                    disabled={busyId === method.id}
                  >
                    <IconTrash size={18} stroke={1.75} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <p className="profile-pay__secure">
          <FaLock aria-hidden />
          Your payment information is encrypted and stored securely by Stripe
        </p>
      </div>
    </article>
  );
}
