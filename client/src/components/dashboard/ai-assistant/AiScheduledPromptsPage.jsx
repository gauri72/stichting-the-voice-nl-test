import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { IconPlus } from "@tabler/icons-react";
import { useAiAssistant } from "../../../contexts/AiAssistantContext.jsx";
import ScheduleTimelineItem from "./ScheduleTimelineItem.jsx";
import ScheduleFormModal from "./ScheduleFormModal.jsx";

export default function AiScheduledPromptsPage() {
  const { t } = useTranslation(["dashboardMain"]);
  const { scheduledPrompts, loadSchedules, createSchedule, updateSchedule, removeSchedule } = useAiAssistant();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const sorted = [...scheduledPrompts].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return new Date(a.nextRunAt || 0) - new Date(b.nextRunAt || 0);
  });

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black p-5 text-slate-100 ring-1 ring-white/10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("dashboardMain:aiAssistant.scheduledPrompts.heading")}</h2>
          <p className="text-sm text-slate-400">{t("dashboardMain:aiAssistant.scheduledPrompts.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-purple-900/30 transition active:scale-95"
        >
          <IconPlus size={16} /> {t("dashboardMain:aiAssistant.scheduledPrompts.newScheduleButton")}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
          {t("dashboardMain:aiAssistant.scheduledPrompts.empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((item) => (
            <ScheduleTimelineItem
              key={item.id}
              item={item}
              onPauseToggle={() => updateSchedule(item.id, { status: item.status === "active" ? "paused" : "active" })}
              onDelete={() => removeSchedule(item.id)}
            />
          ))}
        </ul>
      )}

      <AnimatePresence>
        {modalOpen && <ScheduleFormModal onClose={() => setModalOpen(false)} onCreate={createSchedule} />}
      </AnimatePresence>
    </div>
  );
}
