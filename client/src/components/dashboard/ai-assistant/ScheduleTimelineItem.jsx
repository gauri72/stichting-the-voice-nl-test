import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronDown, IconPlayerPause, IconPlayerPlay, IconTrash, IconMail, IconBellRinging, IconDeviceDesktop } from "@tabler/icons-react";
import CountdownTimer from "./CountdownTimer.jsx";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DELIVERY_ICONS = { dashboard: IconDeviceDesktop, email: IconMail, push: IconBellRinging };

function describeSchedule(schedule) {
  if (schedule.type === "daily") return `Daily at ${schedule.time}`;
  if (schedule.type === "weekly") {
    const days = (schedule.daysOfWeek || []).map((d) => DAY_LABELS[d]).join(", ");
    return `Weekly (${days || "—"}) at ${schedule.time}`;
  }
  if (schedule.type === "once") return `Once on ${new Date(schedule.runAt).toLocaleString()}`;
  return "";
}

export default function ScheduleTimelineItem({ item, onPauseToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const DeliveryIcon = DELIVERY_ICONS[item.deliveryMethod] || IconDeviceDesktop;
  const isActive = item.status === "active";

  return (
    <li className="relative pl-8">
      <span
        className={`absolute left-0 top-2 h-3 w-3 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-600"}`}
      >
        {isActive && (
          <motion.span
            className="absolute inset-0 rounded-full bg-emerald-400"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </span>
      <div className="absolute left-1 top-5 -bottom-5 w-px bg-white/10 last:hidden" aria-hidden="true" />

      <div className="rounded-xl bg-slate-800/60 p-3.5 ring-1 ring-white/10">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={expanded}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{item.promptText}</p>
            <p className="text-xs text-slate-400">{describeSchedule(item.schedule)}</p>
          </div>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="shrink-0 text-slate-400">
            <IconChevronDown size={16} />
          </motion.span>
        </button>

        <div className="mt-2 flex items-center gap-3 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-600/30 text-slate-400"
            }`}
          >
            {isActive ? "Active" : "Paused"}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <DeliveryIcon size={13} /> {item.deliveryMethod}
          </span>
          {isActive && item.nextRunAt && (
            <span className="text-slate-400">
              next in <CountdownTimer targetDate={item.nextRunAt} />
            </span>
          )}
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
              <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-slate-400">
                <p>Last run: {item.lastRunAt ? new Date(item.lastRunAt).toLocaleString() : "never"}</p>
                <p>Next run: {item.nextRunAt ? new Date(item.nextRunAt).toLocaleString() : "—"}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onPauseToggle}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 active:scale-95"
                >
                  {isActive ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
                  {isActive ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-1 rounded-lg bg-red-950/40 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-950/70 active:scale-95"
                >
                  <IconTrash size={14} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}
