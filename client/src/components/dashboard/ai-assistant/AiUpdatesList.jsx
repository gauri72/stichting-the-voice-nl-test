import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconChevronDown, IconMail, IconBellRinging, IconDeviceDesktop, IconRefresh } from "@tabler/icons-react";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";

const CHANNEL_ICONS = { email: IconMail, push: IconBellRinging };

function ChannelPill({ channel, state, t, onResend, resending }) {
  if (!state?.requested) return null;
  const Icon = CHANNEL_ICONS[channel];
  const status = state.status;
  const tone =
    status === "delivered" ? "bg-emerald-500/15 text-emerald-300" :
    status === "pending_retry" ? "bg-amber-500/15 text-amber-300" :
    status === "failed" ? "bg-red-500/15 text-red-300" :
    "bg-white/5 text-slate-400";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Icon size={12} />
      {t(`dashboardMain:aiAssistant.updatesList.channelStatus.${status}`, { defaultValue: status })}
      {status === "failed" ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onResend(channel); }}
          disabled={resending}
          className="ml-1 flex items-center gap-0.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
        >
          <IconRefresh size={10} /> {t("dashboardMain:aiAssistant.updatesList.resend")}
        </button>
      ) : null}
    </span>
  );
}

function UpdateRow({ item }) {
  const { t } = useTranslation(["dashboardMain"]);
  const { markResultRead, resendResult } = useAiAssistant();
  const [expanded, setExpanded] = useState(false);
  const [resending, setResending] = useState(false);
  const isUnread = !item.readAt;

  async function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && isUnread) {
      markResultRead(item.id).catch(() => {});
    }
  }

  async function handleResend(channel) {
    setResending(true);
    try {
      await resendResult(item.id, channel);
    } catch {
      // resend failures just leave the pill at "failed" — nothing further to show here
    } finally {
      setResending(false);
    }
  }

  return (
    <li className="rounded-xl bg-slate-800/60 p-3.5 ring-1 ring-white/10">
      <button type="button" onClick={handleToggle} className="flex w-full items-start justify-between gap-2 text-left" aria-expanded={expanded}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" aria-hidden="true" />}
            <p className="truncate text-sm font-medium text-slate-100">{item.promptText || t("dashboardMain:aiAssistant.updatesList.untitled")}</p>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{new Date(item.deliveredAt).toLocaleString()}</p>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="shrink-0 text-slate-400">
          <IconChevronDown size={16} />
        </motion.span>
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300">
          <IconDeviceDesktop size={12} /> {t("dashboardMain:aiAssistant.updatesList.channelStatus.delivered")}
        </span>
        <ChannelPill channel="email" state={item.channels?.email} t={t} onResend={handleResend} resending={resending} />
        <ChannelPill channel="push" state={item.channels?.push} t={t} onResend={handleResend} resending={resending} />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="mt-3 whitespace-pre-wrap border-t border-white/10 pt-3 text-sm text-slate-300">{item.resultText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function AiUpdatesList() {
  const { t } = useTranslation(["dashboardMain"]);
  const { results } = useAiAssistant();

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
        {t("dashboardMain:aiAssistant.updatesList.empty")}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {results.map((item) => (
        <UpdateRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
