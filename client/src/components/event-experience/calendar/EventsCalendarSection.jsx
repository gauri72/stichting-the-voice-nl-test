import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import useCalendarMonth from "./useCalendarMonth.js";
import CalendarMonthGrid from "./CalendarMonthGrid.jsx";
import CalendarDaySidePanel from "./CalendarDaySidePanel.jsx";
import MobileDateStrip from "./MobileDateStrip.jsx";
import useIsMobileViewport from "../../../hooks/useIsMobileViewport.js";

export default function EventsCalendarSection() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const isMobile = useIsMobileViewport();

  const { data, loading } = useCalendarMonth(year, month);

  function changeMonth(delta) {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  }

  function handleSelectDay(date, dayData) {
    setSelectedDay(date);
    setSelectedDayData(dayData);
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function handleKeyDown(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowLeft") changeMonth(-1);
    if (e.key === "ArrowRight") changeMonth(1);
  }

  return (
    <section
      aria-label="Events Calendar"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-evx-accent"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-evx-heading sm:text-3xl">Events Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="rounded-full border border-evx-border p-2 transition hover:border-evx-accent"
          >
            <IconChevronLeft size={18} />
          </button>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${year}-${month}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="w-36 text-center text-sm font-bold text-evx-text"
            >
              {monthLabel}
            </motion.span>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="rounded-full border border-evx-border p-2 transition hover:border-evx-accent"
          >
            <IconChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-evx-border border-t-evx-accent" />
        </div>
      ) : isMobile ? (
        <MobileDateStrip year={year} month={month} days={data?.days || {}} onSelectDay={handleSelectDay} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            <CalendarMonthGrid year={year} month={month} days={data?.days || {}} onSelectDay={handleSelectDay} />
          </motion.div>
        </AnimatePresence>
      )}

      <CalendarDaySidePanel date={selectedDay} dayData={selectedDayData} onClose={() => setSelectedDay(null)} />
    </section>
  );
}
