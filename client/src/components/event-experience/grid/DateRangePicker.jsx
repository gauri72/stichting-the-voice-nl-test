import { useTranslation } from "react-i18next";

// Custom two-field range, not a date-picker library (none installed in
// this app) — native <input type="date"> is the pragmatic default.
export default function DateRangePicker({ dateFrom, dateTo, onChange }) {
  const { t } = useTranslation(["eventExperience"]);
  return (
    <div className="flex items-center gap-2 rounded-full border border-evx-border px-3 py-1.5">
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onChange("dateFrom", e.target.value)}
        aria-label={t("eventExperience:grid.dateRange.fromAriaLabel")}
        className="bg-transparent text-sm text-evx-text outline-none"
      />
      <span className="text-evx-text-muted" aria-hidden="true">
        –
      </span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onChange("dateTo", e.target.value)}
        aria-label={t("eventExperience:grid.dateRange.toAriaLabel")}
        className="bg-transparent text-sm text-evx-text outline-none"
      />
    </div>
  );
}
