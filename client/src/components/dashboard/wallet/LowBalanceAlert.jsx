import { motion } from "framer-motion";
import { IconAlertTriangle } from "@tabler/icons-react";

export default function LowBalanceAlert({ onTopUp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3"
    >
      <div className="flex items-center gap-2 text-sm text-amber-200">
        <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <IconAlertTriangle size={18} className="text-amber-400" />
        </motion.span>
        Your V.Wallet balance is below your alert threshold.
      </div>
      <button
        type="button"
        onClick={onTopUp}
        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
      >
        Top up now
      </button>
    </motion.div>
  );
}
