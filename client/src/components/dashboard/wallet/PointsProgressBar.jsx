import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Shows progress toward the minimum redemption threshold (or, once past it,
// progress toward the next whole €1 of discount) — a simple, always-relevant
// "tier" to visualize without needing an admin-configured tier ladder.
export default function PointsProgressBar({ points, minRedemptionPoints, pointsNeededPerEuroDiscount }) {
  const { t } = useTranslation(["dashboardMobile"]);
  const target = points < minRedemptionPoints ? minRedemptionPoints : Math.ceil((points + 1) / pointsNeededPerEuroDiscount) * pointsNeededPerEuroDiscount;
  const pct = Math.min(100, Math.round((points / target) * 100));
  const label = points < minRedemptionPoints
    ? t("dashboardMobile:wallet.pointsProgress.toFirstRedemption", { count: minRedemptionPoints - points })
    : t("dashboardMobile:wallet.pointsProgress.toNextDiscount", { count: target - points });

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-semibold text-slate-200">{t("dashboardMobile:wallet.pointsProgress.ptsUnit", { count: points })}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
