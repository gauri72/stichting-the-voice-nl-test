import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconSend2,
  IconPlus,
  IconBookmarkPlus,
  IconHistory,
  IconX,
  IconSparkles,
  IconCalendarEvent,
  IconShoppingBag,
  IconShieldCheck,
  IconWallet,
  IconMicrophone,
  IconLock,
  IconUsers,
} from "@tabler/icons-react";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import { useWallet } from "../../../contexts/WalletContext.jsx";
import { apiFetch, authHeaders } from "../../../utils/api.js";
import ChatMessageBubble from "./ChatMessageBubble.jsx";
import UsageRing from "./UsageRing.jsx";
import vAssistOrb from "../../../assets/Dashboard/v-assist-orb.png";
import "../../../styles/ai-assistant-premium.css";

const STARTERS = [
  { title: "Find an event", subtitle: "Discover what’s on", prompt: "What events are coming up?", icon: IconCalendarEvent },
  { title: "Explore V.Commerce", subtitle: "Shop curated offers", prompt: "Show me featured V.Commerce offers", icon: IconShoppingBag },
  { title: "Check my benefits", subtitle: "See what you’re entitled to", prompt: "What membership benefits can I use?", icon: IconShieldCheck },
  { title: "Use my V.Wallet", subtitle: "View balance & history", prompt: "Help me with my V.Wallet", icon: IconWallet },
];

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
  const { wallet, loadWallet } = useWallet();

  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");
  const [membershipLabel, setMembershipLabel] = useState("Member");
  const scrollRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    loadUsage();
    loadWallet();
    apiFetch("/api/dashboard/memberships", { headers: authHeaders() })
      .then((data) => {
        const active = data?.active;
        setMembershipLabel(active?.planNameAccent || active?.planName || "Member");
      })
      .catch(() => {});
  }, [loadChatHistory, loadUsage, loadWallet]);

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

  const walletBalance = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format((wallet?.balanceMinor || 0) / 100);

  return (
    <div className="ai-chat-shell ai-premium-chat">
      <header className="ai-premium-chat__tools">
        <div>
          <IconSparkles aria-hidden="true" />
          <span>Your personal AI concierge</span>
        </div>
        <div>
          {usage && <UsageRing used={usage.todayCount} limit={usage.dailyLimit} />}
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label="Chat history">
            <IconHistory />
          </button>
          <button type="button" onClick={startNewChat} aria-label="Start a new chat">
            <IconPlus />
            <span>New chat</span>
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="ai-premium-chat__conversation">
        {messages.length === 0 && (
          <div className="ai-premium-welcome">
            <div className="ai-premium-orb" aria-hidden="true">
              <img src={vAssistOrb} alt="" />
            </div>
            <h2>Your Community Concierge</h2>
            <p>How can I help you today?</p>
            <span className="ai-premium-welcome__online"><i /> Online</span>

            <div className="ai-premium-context">
              <div><IconUsers aria-hidden="true" /><span><small>Member context</small><strong>{membershipLabel}</strong></span></div>
              <div><IconWallet aria-hidden="true" /><span><small>V.Wallet</small><strong>{walletBalance}</strong></span></div>
            </div>

            <div className="ai-premium-welcome__intro">
              <strong>Welcome back.</strong>
              <span>Here are a few things I can help you with.</span>
            </div>

            <div className="ai-premium-starters">
              {STARTERS.map(({ title, subtitle, prompt, icon: Icon }) => (
                <button key={title} type="button" onClick={() => setInput(prompt)}>
                  <Icon aria-hidden="true" />
                  <strong>{title}</strong>
                  <span>{subtitle}</span>
                </button>
              ))}
            </div>

            <div className="ai-premium-suggestions">
              <button type="button" onClick={() => setInput("What’s happening this week?")}><IconSparkles /> What’s happening this week?</button>
              <button type="button" onClick={() => setInput("Show me member discounts")}><IconShieldCheck /> Show member discounts</button>
            </div>
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

      <footer className="ai-premium-composer-wrap">
        <p><IconLock /> Private <i /> Personalised <i /> Available 24/7</p>
        <form onSubmit={handleSubmit} className="ai-premium-composer">
          <button type="button" onClick={handleSavePrompt} disabled={!messages.some((m) => m.role === "user")} aria-label="Save last prompt">
            <IconBookmarkPlus />
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
            placeholder="Ask V.Assist anything…"
            rows={1}
            aria-label="Message"
          />
          <button type="button" className="ai-premium-composer__mic" aria-label="Voice input"><IconMicrophone /></button>
          <button type="submit" disabled={!input.trim() || streaming} aria-label="Send message"><IconSend2 /></button>
        </form>
      </footer>

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
