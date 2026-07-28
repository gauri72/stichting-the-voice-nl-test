import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

const DOT_DELAYS = [0, 0.15, 0.3];

export default function TypingIndicator() {
  const { t } = useTranslation(["dashboardMain"]);
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-1 px-4 py-3" role="status" aria-label={t("dashboardMain:aiAssistant.typingIndicator.ariaLabel")}>
      {DOT_DELAYS.map((delay, i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-purple-500 dark:bg-purple-300"
          animate={reduceMotion ? { opacity: [0.4, 1, 0.4] } : { y: [0, -6, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
