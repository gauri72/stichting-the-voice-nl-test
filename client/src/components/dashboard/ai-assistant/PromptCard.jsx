import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconStar, IconStarFilled, IconTrash, IconPlayerPlayFilled } from "@tabler/icons-react";

export default function PromptCard({ prompt, isPrebuilt, onRun, onToggleFavourite, onDelete }) {
  const { t } = useTranslation(["dashboardMain"]);
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group flex flex-col justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200 shadow-md transition-shadow hover:shadow-xl dark:bg-slate-800/60 dark:ring-white/10 hover:shadow-purple-900/20"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug text-slate-900 dark:text-slate-100">{prompt.promptText || prompt.text}</p>
        {!isPrebuilt && (
          <button
            type="button"
            onClick={onToggleFavourite}
            aria-label={prompt.isFavourite ? t("dashboardMain:aiAssistant.promptCard.removeFavouriteAriaLabel") : t("dashboardMain:aiAssistant.promptCard.addFavouriteAriaLabel")}
            className="shrink-0 text-amber-500 transition hover:scale-110 dark:text-amber-300"
          >
            {prompt.isFavourite ? (
              <motion.span
                animate={{ filter: ["drop-shadow(0 0 0px #fbbf24)", "drop-shadow(0 0 6px #fbbf24)", "drop-shadow(0 0 0px #fbbf24)"] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <IconStarFilled size={18} />
              </motion.span>
            ) : (
              <IconStar size={18} className="text-slate-500" />
            )}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="ai-text-10 rounded-full bg-slate-100 px-2 py-0.5 uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {prompt.category}
        </span>
        <div className="flex items-center gap-1">
          {!isPrebuilt && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={t("dashboardMain:aiAssistant.promptCard.deletePromptAriaLabel")}
              className="rounded-md p-1.5 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-300"
            >
              <IconTrash size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onRun}
            aria-label={t("dashboardMain:aiAssistant.promptCard.runPromptAriaLabel")}
            className="ai-text-11 flex items-center gap-1 rounded-md bg-purple-600/80 px-2.5 py-1 font-medium text-white transition hover:bg-purple-500 active:scale-95"
          >
            <IconPlayerPlayFilled size={12} /> {t("dashboardMain:aiAssistant.promptCard.runButton")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
