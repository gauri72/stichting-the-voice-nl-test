import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconPlus } from "@tabler/icons-react";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import PromptCard from "./PromptCard.jsx";

export default function AiPromptLibraryPage() {
  const { t } = useTranslation(["dashboardMain"]);
  const { savedPrompts, prebuiltPrompts, loadPrompts, savePrompt, toggleFavourite, removePrompt, sendMessage, startNewChat } =
    useAiAssistant();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [newPromptText, setNewPromptText] = useState("");

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const categories = useMemo(() => {
    const all = new Set(["all"]);
    savedPrompts.forEach((p) => all.add(p.category));
    prebuiltPrompts.forEach((p) => all.add(p.category));
    return Array.from(all);
  }, [savedPrompts, prebuiltPrompts]);

  const filteredSaved = activeCategory === "all" ? savedPrompts : savedPrompts.filter((p) => p.category === activeCategory);
  const filteredPrebuilt = activeCategory === "all" ? prebuiltPrompts : prebuiltPrompts.filter((p) => p.category === activeCategory);

  async function runPrompt(text) {
    startNewChat();
    navigate("/dashboard/ai-assistant");
    // Give the chat page a tick to mount before streaming starts.
    setTimeout(() => sendMessage(text), 50);
  }

  async function handleAddPrompt(e) {
    e.preventDefault();
    const text = newPromptText.trim();
    if (!text) return;
    await savePrompt(text, "general");
    setNewPromptText("");
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-5 text-slate-100 ring-1 ring-white/10">
      <h2 className="mb-1 text-lg font-semibold">{t("dashboardMain:aiAssistant.promptLibrary.heading")}</h2>
      <p className="mb-4 text-sm text-slate-400">{t("dashboardMain:aiAssistant.promptLibrary.subtitle")}</p>

      <form onSubmit={handleAddPrompt} className="mb-5 flex gap-2">
        <input
          value={newPromptText}
          onChange={(e) => setNewPromptText(e.target.value)}
          placeholder={t("dashboardMain:aiAssistant.promptLibrary.newPromptPlaceholder")}
          aria-label={t("dashboardMain:aiAssistant.promptLibrary.newPromptAriaLabel")}
          className="flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
        />
        <button
          type="submit"
          disabled={!newPromptText.trim()}
          className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-purple-500 active:scale-95 disabled:opacity-40"
        >
          <IconPlus size={16} /> {t("dashboardMain:aiAssistant.promptLibrary.addButton")}
        </button>
      </form>

      {/* Category tabs with animated underline */}
      <div className="mb-5 flex gap-4 overflow-x-auto border-b border-white/10 pb-px">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`relative whitespace-nowrap pb-2 text-sm font-medium transition ${
              activeCategory === cat ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {cat === "all" ? t("dashboardMain:aiAssistant.promptLibrary.allCategory") : cat}
            {activeCategory === cat && (
              <motion.div
                layoutId="prompt-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        ))}
      </div>

      {filteredPrebuilt.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("dashboardMain:aiAssistant.promptLibrary.prebuiltHeading")}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrebuilt.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <PromptCard prompt={p} isPrebuilt onRun={() => runPrompt(p.text)} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("dashboardMain:aiAssistant.promptLibrary.yourPromptsHeading")}</h3>
        {filteredSaved.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dashboardMain:aiAssistant.promptLibrary.emptySaved")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSaved.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <PromptCard
                  prompt={p}
                  onRun={() => runPrompt(p.promptText)}
                  onToggleFavourite={() => toggleFavourite(p.id, !p.isFavourite)}
                  onDelete={() => removePrompt(p.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
