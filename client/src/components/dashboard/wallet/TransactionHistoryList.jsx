import { motion } from "framer-motion";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconStarFilled,
  IconRefresh,
  IconRobot,
  IconShieldCheck,
} from "@tabler/icons-react";

const TYPE_META = {
  topup: { label: "Top-up", icon: IconArrowUpRight, tone: "text-emerald-400" },
  purchase: { label: "Purchase", icon: IconArrowDownRight, tone: "text-red-300" },
  refund: { label: "Refund", icon: IconRefresh, tone: "text-cyan-300" },
  pointsEarned: { label: "Points earned", icon: IconStarFilled, tone: "text-amber-300" },
  pointsRedeemed: { label: "Points redeemed", icon: IconStarFilled, tone: "text-purple-300" },
  pointsExpired: { label: "Points expired", icon: IconStarFilled, tone: "text-slate-500" },
  adminCredit: { label: "Admin credit", icon: IconShieldCheck, tone: "text-cyan-300" },
  adminDebit: { label: "Admin debit", icon: IconShieldCheck, tone: "text-red-300" },
};

export default function TransactionHistoryList({ transactions }) {
  if (!transactions.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No transactions yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {transactions.map((t, i) => {
        const meta = TYPE_META[t.type] || { label: t.type, icon: IconArrowUpRight, tone: "text-slate-300" };
        const Icon = meta.icon;
        const isAi = t.initiatedBy === "ai";
        return (
          <motion.li
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.25 }}
            className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 ${meta.tone}`}>
              <Icon size={16} />
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-slate-100">{meta.label}</p>
                {isAi && (
                  <span className="ai-text-10 flex items-center gap-0.5 rounded-full bg-purple-500/20 px-1.5 py-0.5 font-semibold text-purple-300">
                    <IconRobot size={10} /> AI
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-slate-500">{t.description}</p>
            </div>
            <div className="shrink-0 text-right">
              {t.amountMinor !== 0 && (
                <p className={`text-sm font-semibold tabular-nums ${t.amountMinor > 0 ? "text-emerald-400" : "text-slate-200"}`}>
                  {t.amountMinor > 0 ? "+" : ""}€{(t.amountMinor / 100).toFixed(2)}
                </p>
              )}
              {t.points !== 0 && (
                <p className={`text-xs font-medium tabular-nums ${t.points > 0 ? "text-amber-300" : "text-slate-500"}`}>
                  {t.points > 0 ? "+" : ""}{t.points} pts
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
