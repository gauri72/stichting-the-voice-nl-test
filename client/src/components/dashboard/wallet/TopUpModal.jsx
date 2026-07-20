import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { IconX, IconLock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { getStripePromise } from "../../../utils/stripeClient.js";
import { getStripeElementsAppearance, PAYMENT_ELEMENT_OPTIONS, buildPaymentReturnUrl } from "../../../utils/stripePayment.js";
import { useWallet } from "../../../contexts/WalletContext.jsx";
import { useTheme } from "../../../contexts/ThemeContext.jsx";

const PRESETS_MINOR = [1000, 2000, 5000, 10000];

function InnerPaymentStep({ amountMinor, onSuccess, onError }) {
  const { t } = useTranslation(["dashboardMobile"]);
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || t("dashboardMobile:wallet.topUpModal.errors.checkPaymentDetails"));
      setSubmitting(false);
      return;
    }
    // redirect: "if_required" only skips the redirect when the chosen method
    // doesn't need one (cards). iDEAL/Bancontact etc. send the customer to
    // their bank regardless — return_url is where they land afterward.
    // WalletPage checks isPaymentReturnUrl() on mount to pick this back up.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: buildPaymentReturnUrl("/dashboard/wallet") },
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message || t("dashboardMobile:wallet.topUpModal.errors.paymentIncomplete"));
      setSubmitting(false);
      onError?.(confirmError.message);
      return;
    }
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onSuccess?.();
    } else {
      setError(t("dashboardMobile:wallet.topUpModal.errors.paymentIncomplete"));
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />
      {error && <p className="ai-text-11 text-red-300" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
      >
        <IconLock size={16} /> {submitting ? t("dashboardMobile:wallet.topUpModal.processing") : t("dashboardMobile:wallet.topUpModal.paySecurely", { amount: (amountMinor / 100).toFixed(2) })}
      </button>
    </form>
  );
}

export default function TopUpModal({ onClose }) {
  const { t } = useTranslation(["dashboardMobile"]);
  const { startTopUp, loadWallet, wallet } = useWallet();
  const { isDark } = useTheme();
  const [amountMinor, setAmountMinor] = useState(wallet?.settings?.defaultTopUpAmountMinor || 2000);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState("amount"); // amount | otp | pay | done
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const clientRequestId = useRef(crypto.randomUUID());

  const appearance = useMemo(() => getStripeElementsAppearance(isDark), [isDark]);

  async function handleContinue() {
    setError("");
    setSubmitting(true);
    try {
      const result = await startTopUp({ amountMinor, clientRequestId: clientRequestId.current });
      if (result.otpRequired) {
        setStep("otp");
      } else if (result.clientSecret) {
        setClientSecret(result.clientSecret);
        setStep("pay");
      }
    } catch (e) {
      setError(e.message || t("dashboardMobile:wallet.topUpModal.errors.couldNotStartTopUp"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit() {
    setError("");
    setSubmitting(true);
    try {
      const result = await startTopUp({ amountMinor, otp, clientRequestId: clientRequestId.current });
      if (result.clientSecret) {
        setClientSecret(result.clientSecret);
        setStep("pay");
      }
    } catch (e) {
      setError(e.message || t("dashboardMobile:wallet.topUpModal.errors.incorrectCode"));
    } finally {
      setSubmitting(false);
    }
  }

  function handlePaySuccess() {
    setStep("done");
    loadWallet();
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="ai-nested-modal-backdrop fixed inset-0 bg-black/70" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        role="dialog"
        aria-label={t("dashboardMobile:wallet.topUpModal.dialogAria")}
        className="ai-modal-max-height ai-modal-width ai-modal-centered ai-nested-modal-panel fixed inset-x-0 bottom-0 overflow-y-auto rounded-t-2xl bg-slate-900 p-5 text-slate-100 ring-1 ring-white/10 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{t("dashboardMobile:wallet.topUpModal.title")}</h3>
          <button type="button" onClick={onClose} aria-label={t("dashboardMobile:wallet.topUpModal.closeAria")} className="text-slate-400 hover:text-white">
            <IconX size={20} />
          </button>
        </div>

        {step === "amount" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {PRESETS_MINOR.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setAmountMinor(preset); setCustomAmount(""); }}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                    amountMinor === preset && !customAmount
                      ? "border-purple-400 bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  €{preset / 100}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              placeholder={t("dashboardMobile:wallet.topUpModal.customAmountPlaceholder")}
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                const parsed = Math.round(Number(e.target.value) * 100);
                if (parsed > 0) setAmountMinor(parsed);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
            {error && <p className="ai-text-11 text-red-300" role="alert">{error}</p>}
            <button
              type="button"
              onClick={handleContinue}
              disabled={submitting || amountMinor < 100}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? t("dashboardMobile:wallet.topUpModal.pleaseWait") : t("dashboardMobile:wallet.topUpModal.continueWith", { amount: (amountMinor / 100).toFixed(2) })}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {t("dashboardMobile:wallet.topUpModal.otpIntro")}
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder={t("dashboardMobile:wallet.topUpModal.otpPlaceholder")}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-center text-lg tracking-widest text-white placeholder:tracking-normal placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
            {error && <p className="ai-text-11 text-red-300" role="alert">{error}</p>}
            <button
              type="button"
              onClick={handleOtpSubmit}
              disabled={submitting || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? t("dashboardMobile:wallet.topUpModal.verifying") : t("dashboardMobile:wallet.topUpModal.verifyAndContinue")}
            </button>
          </div>
        )}

        {step === "pay" && clientSecret && (
          <Elements stripe={getStripePromise()} options={{ clientSecret, appearance }}>
            <InnerPaymentStep amountMinor={amountMinor} onSuccess={handlePaySuccess} onError={setError} />
          </Elements>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                />
              </svg>
            </motion.div>
            <p className="text-sm font-medium text-slate-200">{t("dashboardMobile:wallet.topUpModal.topUpSuccessful")}</p>
            <button type="button" onClick={onClose} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20">
              {t("dashboardMobile:wallet.topUpModal.close")}
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
