import { toDayKey, isSameDay, categoryColor } from "./calendarUtils.js";

export default function MobileDateStrip({ year, month, days, onSelectDay }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month - 1, i + 1);
        const dayData = days[toDayKey(date)];
        const todayFlag = isSameDay(date, today);
        return (
          <button
            key={i}
            type="button"
            onClick={() => dayData && onSelectDay(date, dayData)}
            disabled={!dayData}
            aria-label={`${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric" })}${dayData ? `, ${dayData.count} event${dayData.count === 1 ? "" : "s"}` : ""}`}
            className={`flex flex-shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 ${
              dayData ? "border-evx-border bg-evx-surface" : "border-transparent text-evx-text-muted"
            } ${todayFlag ? "ring-2 ring-evx-accent" : ""}`}
          >
            <span className="text-[10px] uppercase text-evx-text-muted">
              {date.toLocaleDateString("en-GB", { weekday: "short" })}
            </span>
            <span className="text-sm font-bold text-evx-text">{date.getDate()}</span>
            {dayData ? (
              <span className={`h-1.5 w-1.5 rounded-full ${categoryColor(dayData.categories[0])}`} aria-hidden="true" />
            ) : (
              <span className="h-1.5 w-1.5" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
