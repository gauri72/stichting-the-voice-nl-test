import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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

const STARTER_DEFS = [
  { key: "findEvent", icon: IconCalendarEvent },
  { key: "exploreCommerce", icon: IconShoppingBag },
  { key: "checkBenefits", icon: IconShieldCheck },
  { key: "useWallet", icon: IconWallet },
];

export default function AiChatPage() {
  const { t } = useTranslation(["dashboardMain"]);
  const STARTERS = STARTER_DEFS.map(({ key, icon }) => ({
    title: t(`dashboardMain:aiAssistant.chat.starters.${key}.title`),
    subtitle: t(`dashboardMain:aiAssistant.chat.starters.${key}.subtitle`),
    prompt: t(`dashboardMain:aiAssistant.chat.starters.${key}.prompt`),
    icon,
  }));
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
  const [membershipLabel, setMembershipLabel] = useState(t("dashboardMain:aiAssistant.chat.defaultMembershipLabel"));
  const scrollRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    loadUsage();
    loadWallet();
    apiFetch("/api/dashboard/memberships", { headers: authHeaders() })
      .then((data) => {
        const active = data?.active;
        setMembershipLabel(active?.planNameAccent || active?.planName || t("dashboardMain:aiAssistant.chat.defaultMembershipLabel"));
      })
      .catch(() => {});
  }, [loadChatHistory, loadUsage, loadWallet, t]);

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
    setSaveFeedback(t("dashboardMain:aiAssistant.chat.savePromptFeedback"));
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
          <span>{t("dashboardMain:aiAssistant.chat.header.tagline")}</span>
        </div>
        <div>
          {usage && <UsageRing used={usage.todayCount} limit={usage.dailyLimit} />}
          <button type="button" onClick={() => setHistoryOpen(true)} aria-label={t("dashboardMain:aiAssistant.chat.header.chatHistoryAriaLabel")}>
            <IconHistory />
          </button>
          <button type="button" onClick={startNewChat} aria-label={t("dashboardMain:aiAssistant.chat.header.newChatAriaLabel")}>
            <IconPlus />
            <span>{t("dashboardMain:aiAssistant.chat.header.newChat")}</span>
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="ai-premium-chat__conversation">
        {messages.length === 0 && (
          <div className="ai-premium-welcome">
            <div className="ai-premium-orb" aria-hidden="true">
              <img src={vAssistOrb} alt="" />
            </div>
            <h2>{t("dashboardMain:aiAssistant.chat.welcome.heading")}</h2>
            <p>{t("dashboardMain:aiAssistant.chat.welcome.subheading")}</p>
            <span className="ai-premium-welcome__online"><i /> {t("dashboardMain:aiAssistant.chat.welcome.online")}</span>

            <div className="ai-premium-context">
              <div><IconUsers aria-hidden="true" /><span><small>{t("dashboardMain:aiAssistant.chat.welcome.memberContextLabel")}</small><strong>{membershipLabel}</strong></span></div>
              <div><IconWallet aria-hidden="true" /><span><small>{t("dashboardMain:aiAssistant.chat.welcome.walletLabel")}</small><strong>{walletBalance}</strong></span></div>
            </div>

            <div className="ai-premium-welcome__intro">
              <strong>{t("dashboardMain:aiAssistant.chat.welcome.introTitle")}</strong>
              <span>{t("dashboardMain:aiAssistant.chat.welcome.introSubtitle")}</span>
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
              <button type="button" onClick={() => setInput(t("dashboardMain:aiAssistant.chat.suggestions.weekAheadPrompt"))}><IconSparkles /> {t("dashboardMain:aiAssistant.chat.suggestions.weekAheadLabel")}</button>
              <button type="button" onClick={() => setInput(t("dashboardMain:aiAssistant.chat.suggestions.discountsPrompt"))}><IconShieldCheck /> {t("dashboardMain:aiAssistant.chat.suggestions.discountsLabel")}</button>
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
            {t("dashboardMain:aiAssistant.chat.errorDismiss")}
          </button>
        </motion.p>
      )}

      <footer className="ai-premium-composer-wrap">
        <p><IconLock /> {t("dashboardMain:aiAssistant.chat.footerTags.private")} <i /> {t("dashboardMain:aiAssistant.chat.footerTags.personalised")} <i /> {t("dashboardMain:aiAssistant.chat.footerTags.available247")}</p>
        <form onSubmit={handleSubmit} className="ai-premium-composer">
          <button type="button" onClick={handleSavePrompt} disabled={!messages.some((m) => m.role === "user")} aria-label={t("dashboardMain:aiAssistant.chat.composer.saveLastPromptAriaLabel")}>
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
            placeholder={t("dashboardMain:aiAssistant.chat.composer.placeholder")}
            rows={1}
            aria-label={t("dashboardMain:aiAssistant.chat.composer.messageAriaLabel")}
          />
          <button type="button" className="ai-premium-composer__mic" aria-label={t("dashboardMain:aiAssistant.chat.composer.voiceInputAriaLabel")}><IconMicrophone /></button>
          <button type="submit" disabled={!input.trim() || streaming} aria-label={t("dashboardMain:aiAssistant.chat.composer.sendAriaLabel")}><IconSend2 /></button>
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
              aria-label={t("dashboardMain:aiAssistant.chat.history.heading")}
              className="ai-chat-history-panel ai-nested-modal-panel fixed inset-x-0 bottom-0 overflow-y-auto rounded-t-2xl bg-slate-900 p-4 ring-1 ring-white/10 sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:bottom-auto sm:w-72 sm:rounded-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{t("dashboardMain:aiAssistant.chat.history.heading")}</h3>
                <button type="button" onClick={() => setHistoryOpen(false)} aria-label={t("dashboardMain:aiAssistant.chat.history.closeAriaLabel")} className="text-slate-400 hover:text-white">
                  <IconX size={18} />
                </button>
              </div>
              {chatHistory.length === 0 ? (
                <p className="text-xs text-slate-500">{t("dashboardMain:aiAssistant.chat.history.empty")}</p>
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
