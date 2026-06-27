import { motion, useReducedMotion } from "framer-motion";
import { IconRobot, IconUser } from "@tabler/icons-react";
import TypingIndicator from "./TypingIndicator.jsx";
import WalletBookingBadge, { WalletToolIndicator } from "./WalletBookingBadge.jsx";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatMessageBubble({ message }) {
  const reduceMotion = useReducedMotion();
  const isUser = message.role === "user";
  const isEmpty = !message.content && message.streaming;

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white">
          <IconRobot size={18} aria-hidden="true" />
        </div>
      )}

      <div className={`ai-bubble-max-width flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          role="article"
          aria-label={isUser ? "Your message" : "Assistant message"}
          className={
            isUser
              ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-purple-600 to-purple-500 px-4 py-2.5 text-white shadow-lg shadow-purple-900/20"
              : `rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-lg shadow-black/20 ${
                  message.isError ? "bg-red-950/60 text-red-200 ring-1 ring-red-500/40" : "bg-slate-800/80 text-slate-100 ring-1 ring-white/5"
                }`
          }
        >
          {isEmpty ? (
            <TypingIndicator />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
              {message.streaming && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" aria-hidden="true" />
              )}
            </p>
          )}
          {message.toolCall && <WalletToolIndicator tool={message.toolCall} />}
          {message.walletBooking && <WalletBookingBadge booking={message.walletBooking} />}
        </div>
        {message.timestamp && !message.streaming && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="ai-text-11 mt-1 px-1 text-slate-500"
          >
            {formatTime(message.timestamp)}
          </motion.span>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-200">
          <IconUser size={16} aria-hidden="true" />
        </div>
      )}
    </motion.div>
  );
}
