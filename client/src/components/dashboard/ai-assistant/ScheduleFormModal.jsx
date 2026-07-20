import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconX, IconMail, IconBellRinging, IconDeviceDesktop } from "@tabler/icons-react";
import { usePushSubscription } from "./usePushSubscription.js";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DELIVERY_OPTION_DEFS = [
  { value: "dashboard", icon: IconDeviceDesktop },
  { value: "email", icon: IconMail },
  { value: "push", icon: IconBellRinging },
];

export default function ScheduleFormModal({ onClose, onCreate }) {
  const { t } = useTranslation(["dashboardMain"]);
  const WEEKDAYS = WEEKDAY_KEYS.map((key) => t(`dashboardMain:aiAssistant.scheduleModal.weekdays.${key}`));
  const DELIVERY_OPTIONS = DELIVERY_OPTION_DEFS.map((opt) => ({
    ...opt,
    label: t(`dashboardMain:aiAssistant.scheduleModal.delivery.${opt.value}`),
  }));
  const [promptText, setPromptText] = useState("");
  const [type, setType] = useState("daily");
  const [time, setTime] = useState("08:00");
  const [daysOfWeek, setDaysOfWeek] = useState([1]);
  const [runAt, setRunAt] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("dashboard");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const { status: pushStatus, error: pushError, subscribe } = usePushSubscription();

  function toggleDay(day) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function handleDeliverySelect(value) {
    setDeliveryMethod(value);
    if (value === "push" && pushStatus !== "granted") {
      await subscribe();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!promptText.trim()) return setFormError(t("dashboardMain:aiAssistant.scheduleModal.errors.promptRequired"));
    if (type === "weekly" && daysOfWeek.length === 0) return setFormError(t("dashboardMain:aiAssistant.scheduleModal.errors.pickDay"));
    if (type === "once" && !runAt) return setFormError(t("dashboardMain:aiAssistant.scheduleModal.errors.pickDateTime"));

    const schedule =
      type === "once"
        ? { type, runAt: new Date(runAt).toISOString() }
        : type === "weekly"
          ? { type, time, daysOfWeek }
          : { type, time };

    setSubmitting(true);
    try {
      await onCreate({ promptText: promptText.trim(), schedule, deliveryMethod });
      onClose();
    } catch (err) {
      setFormError(err.message || t("dashboardMain:aiAssistant.scheduleModal.errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
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
        aria-label={t("dashboardMain:aiAssistant.scheduleModal.ariaLabel")}
        className="ai-modal-max-height ai-modal-width ai-modal-centered ai-nested-modal-panel fixed inset-x-0 bottom-0 overflow-y-auto rounded-t-2xl bg-slate-900 p-5 text-slate-100 ring-1 ring-white/10 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{t("dashboardMain:aiAssistant.scheduleModal.heading")}</h3>
          <button type="button" onClick={onClose} aria-label={t("dashboardMain:aiAssistant.scheduleModal.closeAriaLabel")} className="text-slate-400 hover:text-white">
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{t("dashboardMain:aiAssistant.scheduleModal.fields.prompt")}</label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={2}
              placeholder={t("dashboardMain:aiAssistant.scheduleModal.fields.promptPlaceholder")}
              className="w-full resize-none rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{t("dashboardMain:aiAssistant.scheduleModal.fields.frequency")}</label>
            <div className="flex gap-2">
              {[
                { v: "daily", l: t("dashboardMain:aiAssistant.scheduleModal.frequencyOptions.daily") },
                { v: "weekly", l: t("dashboardMain:aiAssistant.scheduleModal.frequencyOptions.weekly") },
                { v: "once", l: t("dashboardMain:aiAssistant.scheduleModal.frequencyOptions.once") },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setType(opt.v)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    type === opt.v ? "bg-purple-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {type !== "once" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">{t("dashboardMain:aiAssistant.scheduleModal.fields.time")}</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
              />
            </div>
          )}

          {type === "weekly" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">{t("dashboardMain:aiAssistant.scheduleModal.fields.days")}</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      daysOfWeek.includes(i) ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === "once" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">{t("dashboardMain:aiAssistant.scheduleModal.fields.dateTime")}</label>
              <input
                type="datetime-local"
                value={runAt}
                onChange={(e) => setRunAt(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">{t("dashboardMain:aiAssistant.scheduleModal.fields.deliveryMethod")}</label>
            <div className="flex gap-2">
              {DELIVERY_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleDeliverySelect(value)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition ${
                    deliveryMethod === value ? "bg-purple-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {deliveryMethod === "push" && pushStatus === "denied" && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ai-text-11 mt-1.5 text-amber-300">
                  {pushError || t("dashboardMain:aiAssistant.scheduleModal.pushBlocked")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {formError && <p className="text-xs text-red-300">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? t("dashboardMain:aiAssistant.scheduleModal.submit.saving") : t("dashboardMain:aiAssistant.scheduleModal.submit.default")}
          </button>
        </form>
      </motion.div>
    </>
  );
}
