import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconWallet, IconCheck, IconLoader2 } from "@tabler/icons-react";

const TOOL_LABEL_KEYS = {
  find_events: "findEvents",
  prepare_wallet_booking: "prepareBooking",
  execute_wallet_booking: "executeBooking",
};

/** Shown inline in a chat bubble while a wallet tool is running, or as a confirmation card once a booking completes. */
export function WalletToolIndicator({ tool }) {
  const { t } = useTranslation(["dashboardMain"]);
  const key = TOOL_LABEL_KEYS[tool];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-700 ring-1 ring-purple-400/20 dark:text-purple-300"
    >
      <IconLoader2 size={14} className="animate-spin" />
      {key ? t(`dashboardMain:aiAssistant.walletBadge.toolLabels.${key}`) : t("dashboardMain:aiAssistant.walletBadge.toolLabels.working")}
    </motion.div>
  );
}

export default function WalletBookingBadge({ booking }) {
  const { t } = useTranslation(["dashboardMain"]);
  if (!booking?.success) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="mt-2 flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-500/20 p-3 ring-1 ring-purple-400/30"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white">
        <IconWallet size={16} />
      </span>
      <div className="flex-1">
        <p className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white">
          <IconCheck size={14} className="text-emerald-600 dark:text-emerald-400" /> {t("dashboardMain:aiAssistant.walletBadge.bookedTitle")}
        </p>
        <p className="ai-text-11 text-slate-600 dark:text-slate-400">
          {t("dashboardMain:aiAssistant.walletBadge.summary", {
            quantity: booking.quantity,
            eventTitle: booking.eventTitle,
            amount: (booking.totalAmountMinor / 100).toFixed(2),
          })}
          {booking.pointsEarned > 0 ? ` · ${t("dashboardMain:aiAssistant.walletBadge.pointsEarned", { points: booking.pointsEarned })}` : ""}
        </p>
      </div>
    </motion.div>
  );
}
