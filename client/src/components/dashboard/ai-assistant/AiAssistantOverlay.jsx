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
            className="ai-overlay-panel ai-premium-panel"
          >
            <header className="ai-premium-panel__header">
              <div className="ai-premium-panel__brand" aria-label="V.Assist">
                <span>V</span>
                <strong>V.Assist</strong>
              </div>
              <button type="button" onClick={closeAssistant} aria-label="Close V Assist" className="ai-premium-panel__close">
                <IconX />
              </button>
            </header>
            <div className="ai-premium-panel__tabs">
              <div>
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={activeTab === id ? "is-active" : ""}
                    aria-label={label}
                    title={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
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
