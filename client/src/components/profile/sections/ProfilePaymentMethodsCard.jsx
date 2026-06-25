import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

function describeMethod(method, t) {
  if (method.type === "card") {
    const wallet = walletLabel(method.wallet);
    return {
      primary: `${brandTitle(method.brand)} •••• ${method.last4}`,
      secondary: [
        method.expMonth && method.expYear
          ? t("misc:profile.paymentMethods.expires", {
              date: `${String(method.expMonth).padStart(2, "0")}/${String(method.expYear).slice(-2)}`,
            })
          : "",
        wallet,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }
  if (method.type === "sepa_debit") {
    return {
      primary: t("misc:profile.paymentMethods.sepaPrimary", { last4: method.last4 }),
      secondary: t("misc:profile.paymentMethods.sepaSecondary"),
    };
  }
  if (method.type === "ideal") {
    return { primary: "iDEAL", secondary: method.bank ? method.bank.toUpperCase() : t("misc:profile.paymentMethods.idealSecondary") };
  }
  if (method.type === "paypal") {
    return { primary: "PayPal", secondary: method.email || "" };
  }
  return { primary: method.label || method.brand, secondary: "" };
}

export default function ProfilePaymentMethodsCard() {
  const { t } = useTranslation(["misc"]);
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
      setError(e.message || t("misc:profile.paymentMethods.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
          setStatus(t("misc:profile.paymentMethods.savedSuccess"));
          await load();
        },
        onError: (msg) => setError(msg),
      });
    });
  }, [load, t]);

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
      setStatus(t("misc:profile.paymentMethods.defaultUpdated"));
    } catch (e) {
      setError(e.message || t("misc:profile.paymentMethods.errorSetDefault"));
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t("misc:profile.paymentMethods.removeConfirm"))) return;
    setBusyId(id);
    setError("");
    setStatus("");
    try {
      const data = await apiFetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setMethods(data?.methods || []);
      setStatus(t("misc:profile.paymentMethods.removed"));
    } catch (e) {
      setError(e.message || t("misc:profile.paymentMethods.errorRemove"));
    } finally {
      setBusyId("");
    }
  }

  async function handleSaved() {
    setAdding(false);
    setStatus(t("misc:profile.paymentMethods.savedSuccess"));
    await load();
  }

  return (
    <article className="profile-card profile-card--payment">
      <div className="profile-card__head">
        <span className="profile-card__icon" aria-hidden>
          <IconCreditCard size={20} stroke={1.75} />
        </span>
        <span className="profile-card__head-copy">
          <strong className="profile-card__title">{t("misc:profile.paymentMethods.title")}</strong>
          <span className="profile-card__subtitle">
            {t("misc:profile.paymentMethods.subtitle")}
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
            {t("misc:profile.paymentMethods.add")}
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
          <p className="profile-pay__hint">{t("misc:profile.paymentMethods.loading")}</p>
        ) : null}

        {!loading && !adding && methods.length === 0 ? (
          <p className="profile-pay__hint">
            {t("misc:profile.paymentMethods.empty")}
          </p>
        ) : null}

        {methods.length > 0 ? (
          <ul className="profile-pay__list">
            {methods.map((method) => {
              const info = describeMethod(method, t);
              return (
                <li key={method.id} className="profile-pay__item">
                  <BrandMark method={method} />
                  <div className="profile-pay__copy">
                    <strong>{info.primary}</strong>
                    {info.secondary ? <span>{info.secondary}</span> : null}
                  </div>
                  {method.isDefault ? (
                    <span className="profile-pay__badge">{t("misc:profile.paymentMethods.default")}</span>
                  ) : (
                    <button
                      type="button"
                      className="profile-btn profile-btn--outline profile-btn--compact"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={busyId === method.id}
                    >
                      {busyId === method.id ? "…" : t("misc:profile.paymentMethods.setDefault")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="profile-pay__menu"
                    aria-label={t("misc:profile.paymentMethods.remove", { label: info.primary })}
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
          {t("misc:profile.paymentMethods.secure")}
        </p>
      </div>
    </article>
  );
}
