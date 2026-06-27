import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconSend2,
  IconPlus,
  IconBookmarkPlus,
  IconHistory,
  IconX,
  IconSparkles,
} from "@tabler/icons-react";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import ChatMessageBubble from "./ChatMessageBubble.jsx";
import UsageRing from "./UsageRing.jsx";

export default function AiChatPage() {
  const {
    messages,
    streaming,
    error,
    setError,
    sendMessage,
    startNewChat,
    chatHistory,
    loadChatHistory,
    openChatSession,
    savePrompt,
    usage,
    loadUsage,
  } = useAiAssistant();

  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    loadUsage();
  }, [loadChatHistory, loadUsage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    await sendMessage(text);
    loadChatHistory();
  }

  async function handleSavePrompt() {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) return;
    await savePrompt(lastUserMessage.content, "general");
    setSaveFeedback("Saved to your prompt library!");
    setTimeout(() => setSaveFeedback(""), 2500);
  }

  return (
    <div className="ai-chat-shell relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 ring-1 ring-white/10">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <IconSparkles size={20} className="text-purple-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-wide">Personal AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          {usage && <UsageRing used={usage.todayCount} limit={usage.dailyLimit} />}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label="Chat history"
            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
          >
            <IconHistory size={18} />
          </button>
          <button
            type="button"
            onClick={startNewChat}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
          >
            <IconPlus size={14} /> New Chat
          </button>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
            <IconSparkles size={32} className="text-purple-400/60" />
            <p className="text-sm">Ask me about news, weather, or your upcoming events.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <ChatMessageBubble key={i} message={m} />
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ x: 0 }}
          animate={{ x: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 0.4 }}
          role="alert"
          className="mx-4 mb-2 rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/30"
        >
          {error}
          <button type="button" onClick={() => setError("")} className="ml-2 underline">
            Dismiss
          </button>
        </motion.p>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-white/10 bg-white/5 p-3 sm:p-4">
        <button
          type="button"
          onClick={handleSavePrompt}
          disabled={!messages.some((m) => m.role === "user")}
          aria-label="Save last prompt to your library"
          className="rounded-lg p-2.5 text-slate-300 transition hover:bg-white/10 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
        >
          <IconBookmarkPlus size={18} />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask your assistant anything…"
          rows={1}
          aria-label="Message"
          className="flex-1 resize-none rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          aria-label="Send message"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-900/30 transition active:scale-90 disabled:opacity-40"
        >
          <IconSend2 size={18} />
        </button>
      </form>

      <AnimatePresence>
        {saveFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg"
          >
            {saveFeedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat history — slides in as a bottom sheet on mobile, side panel on desktop */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              className="ai-nested-modal-backdrop fixed inset-0 bg-black/60"
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              role="dialog"
              aria-label="Chat history"
              className="ai-chat-history-panel ai-nested-modal-panel fixed inset-x-0 bottom-0 overflow-y-auto rounded-t-2xl bg-slate-900 p-4 ring-1 ring-white/10 sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:bottom-auto sm:w-72 sm:rounded-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Chat History</h3>
                <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close" className="text-slate-400 hover:text-white">
                  <IconX size={18} />
                </button>
              </div>
              {chatHistory.length === 0 ? (
                <p className="text-xs text-slate-500">No previous chats yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {chatHistory.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          openChatSession(s.id);
                          setHistoryOpen(false);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                      >
                        <span className="block truncate">{s.title}</span>
                        <span className="ai-text-11 text-slate-500">{new Date(s.lastMessageAt).toLocaleDateString()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
