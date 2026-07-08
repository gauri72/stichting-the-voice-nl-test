import CalendarDayCell from "./CalendarDayCell.jsx";
import { getMonthGridDays, toDayKey, isSameDay } from "./calendarUtils.js";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarMonthGrid({ year, month, days, onSelectDay }) {
  const cells = getMonthGridDays(year, month);
  const today = new Date();

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-evx-text-muted">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => (
          <CalendarDayCell
            key={date ? toDayKey(date) : `blank-${i}`}
            date={date}
            dayData={date ? days[toDayKey(date)] : null}
            isToday={date ? isSameDay(date, today) : false}
            onSelect={onSelectDay}
          />
        ))}
      </div>
    </div>
  );
}
