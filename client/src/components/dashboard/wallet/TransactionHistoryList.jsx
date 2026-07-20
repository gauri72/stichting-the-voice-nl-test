import { motion } from "framer-motion";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconStarFilled,
  IconRefresh,
  IconRobot,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const TYPE_ICONS = {
  topup: { icon: IconArrowUpRight, tone: "text-emerald-400" },
  purchase: { icon: IconArrowDownRight, tone: "text-red-300" },
  refund: { icon: IconRefresh, tone: "text-cyan-300" },
  pointsEarned: { icon: IconStarFilled, tone: "text-amber-300" },
  pointsRedeemed: { icon: IconStarFilled, tone: "text-purple-300" },
  pointsExpired: { icon: IconStarFilled, tone: "text-slate-500" },
  adminCredit: { icon: IconShieldCheck, tone: "text-cyan-300" },
  adminDebit: { icon: IconShieldCheck, tone: "text-red-300" },
};

export default function TransactionHistoryList({ transactions }) {
  const { t } = useTranslation(["dashboardMobile"]);

  if (!transactions.length) {
    return <p className="py-8 text-center text-sm text-slate-500">{t("dashboardMobile:wallet.transactionHistory.empty")}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {transactions.map((tx, i) => {
        const iconMeta = TYPE_ICONS[tx.type] || { icon: IconArrowUpRight, tone: "text-slate-300" };
        const label = t(`dashboardMobile:wallet.transactionHistory.types.${tx.type}`, { defaultValue: tx.type });
        const Icon = iconMeta.icon;
        const isAi = tx.initiatedBy === "ai";
        return (
          <motion.li
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.25 }}
            className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 ${iconMeta.tone}`}>
              <Icon size={16} />
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-slate-100">{label}</p>
                {isAi && (
                  <span className="ai-text-10 flex items-center gap-0.5 rounded-full bg-purple-500/20 px-1.5 py-0.5 font-semibold text-purple-300">
                    <IconRobot size={10} /> {t("dashboardMobile:wallet.transactionHistory.aiBadge")}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-slate-500">{tx.description}</p>
            </div>
            <div className="shrink-0 text-right">
              {tx.amountMinor !== 0 && (
                <p className={`text-sm font-semibold tabular-nums ${tx.amountMinor > 0 ? "text-emerald-400" : "text-slate-200"}`}>
                  {tx.amountMinor > 0 ? "+" : ""}€{(tx.amountMinor / 100).toFixed(2)}
                </p>
              )}
              {tx.points !== 0 && (
                <p className={`text-xs font-medium tabular-nums ${tx.points > 0 ? "text-amber-300" : "text-slate-500"}`}>
                  {tx.points > 0 ? "+" : ""}{tx.points} {t("dashboardMobile:wallet.transactionHistory.ptsSuffix")}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
