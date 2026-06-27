import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconMessageCircle2, IconBooks, IconCalendarTime, IconX } from "@tabler/icons-react";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import AiChatPage from "./AiChatPage.jsx";
import AiPromptLibraryPage from "./AiPromptLibraryPage.jsx";
import AiScheduledPromptsPage from "./AiScheduledPromptsPage.jsx";

const TABS = [
  { id: "chat", label: "Chat", icon: IconMessageCircle2 },
  { id: "prompts", label: "Prompt Library", icon: IconBooks },
  { id: "schedule", label: "Scheduled Prompts", icon: IconCalendarTime },
];

export default function AiAssistantOverlay() {
  const { isOverlayOpen, closeAssistant } = useAiAssistant();
  const [activeTab, setActiveTab] = useState("chat");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOverlayOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeAssistant();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOverlayOpen, closeAssistant]);

  useEffect(() => {
    if (isOverlayOpen) setActiveTab("chat");
  }, [isOverlayOpen]);

  return (
    <AnimatePresence>
      {isOverlayOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAssistant}
            className="ai-overlay-backdrop bg-black/70"
            aria-hidden="true"
          />
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label="V Assist"
            className="ai-overlay-panel bg-slate-950 text-slate-100 ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-2.5">
              <div className="flex items-center gap-1 overflow-x-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 ${
                      activeTab === id
                        ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={closeAssistant}
                aria-label="Close V Assist"
                className="flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className={`ai-overlay-body ${activeTab === "chat" ? "ai-overlay-body--chat" : ""}`}>
              {activeTab === "chat" && <AiChatPage />}
              {activeTab === "prompts" && <AiPromptLibraryPage />}
              {activeTab === "schedule" && <AiScheduledPromptsPage />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
