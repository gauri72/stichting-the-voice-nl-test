import { useState } from "react";
import { IconVideo } from "@tabler/icons-react";
import CalendarDayTooltip from "./CalendarDayTooltip.jsx";
import { categoryColor } from "./calendarUtils.js";

export default function CalendarDayCell({ date, dayData, isToday, onSelect }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!date) return <div className="aspect-square" aria-hidden="true" />;

  const hasEvents = Boolean(dayData?.count);

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <button
        type="button"
        onClick={() => hasEvents && onSelect(date, dayData)}
        disabled={!hasEvents}
        aria-label={`${date.getDate()}${hasEvents ? `, ${dayData.count} event${dayData.count === 1 ? "" : "s"}` : ", no events"}`}
        className={`relative flex aspect-square w-full flex-col items-start gap-0.5 overflow-hidden rounded-lg border p-1.5 text-left transition-colors sm:p-2 ${
          hasEvents
            ? "cursor-pointer border-evx-border bg-evx-surface hover:border-evx-accent"
            : "cursor-default border-transparent text-evx-text-muted"
        }`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-evx-text ${
            isToday ? "animate-pulse ring-2 ring-evx-accent" : ""
          }`}
        >
          {date.getDate()}
        </span>

        {hasEvents ? (
          <>
            <div className="mt-0.5 flex flex-wrap gap-0.5" aria-hidden="true">
              {dayData.categories.slice(0, 3).map((cat) => (
                <span key={cat} className={`h-1.5 w-1.5 rounded-full ${categoryColor(cat)}`} />
              ))}
            </div>
            <span className="absolute right-1 top-1 rounded-full bg-evx-accent px-1.5 text-[10px] font-bold text-white">
              {dayData.count}
            </span>
            {dayData.hasVideo ? (
              <IconVideo size={12} className="absolute bottom-1 right-1 text-evx-accent" aria-label="Has Short" />
            ) : null}
            <span className="mt-auto line-clamp-1 hidden text-[10px] text-evx-text-muted sm:block">
              {dayData.events[0]?.title}
            </span>
          </>
        ) : null}
      </button>

      {showTooltip && hasEvents ? <CalendarDayTooltip dayData={dayData} /> : null}
    </div>
  );
}
