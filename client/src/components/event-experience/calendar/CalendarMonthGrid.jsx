import { useTranslation } from "react-i18next";
import CalendarDayCell from "./CalendarDayCell.jsx";
import { getMonthGridDays, toDayKey, isSameDay } from "./calendarUtils.js";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function CalendarMonthGrid({ year, month, days, onSelectDay }) {
  const { t } = useTranslation(["eventExperience"]);
  const cells = getMonthGridDays(year, month);
  const today = new Date();

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-evx-text-muted">
        {WEEKDAY_KEYS.map((key) => (
          <span key={key}>{t(`eventExperience:calendar.monthGrid.weekdays.${key}`)}</span>
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
