import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function colorForRatio(ratio) {
  if (ratio >= 0.9) return "#f87171"; // red
  if (ratio >= 0.65) return "#fbbf24"; // amber
  return "#34d399"; // green
}

/** Animated circular usage indicator: green -> amber -> red as quota fills, with a count-up label. */
export default function UsageRing({ used, limit }) {
  const { t } = useTranslation(["dashboardMain"]);
  const unlimited = limit < 0;
  const ratio = unlimited ? 0 : Math.min(1, used / Math.max(limit, 1));
  const color = colorForRatio(ratio);

  const [displayUsed, setDisplayUsed] = useState(0);
  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = displayUsed;
    const duration = 600;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      setDisplayUsed(Math.round(from + (used - from) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [used]);

  return (
    <div
      className="relative flex h-9 w-9 items-center justify-center"
      title={unlimited ? t("dashboardMain:aiAssistant.usageRing.unlimitedTitle", { used }) : t("dashboardMain:aiAssistant.usageRing.limitedTitle", { used, limit })}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        {!unlimited && (
          <motion.circle
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - ratio) }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </svg>
      <span className="ai-text-9 absolute font-semibold text-slate-200">{unlimited ? "∞" : displayUsed}</span>
    </div>
  );
}
