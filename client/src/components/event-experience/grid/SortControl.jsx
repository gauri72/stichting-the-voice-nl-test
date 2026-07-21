import { useTranslation } from "react-i18next";

const SORT_OPTIONS = [
  { value: "date", labelKey: "date" },
  { value: "popularity", labelKey: "popularity" },
  { value: "price_asc", labelKey: "priceAsc" },
  { value: "price_desc", labelKey: "priceDesc" },
];

export default function SortControl({ value, onChange }) {
  const { t } = useTranslation(["eventExperience"]);
  return (
    <label className="flex items-center gap-2 whitespace-nowrap text-sm text-evx-text-secondary">
      {t("eventExperience:grid.sortLabel")}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-evx-border bg-transparent px-3 py-2 text-sm text-evx-text"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {t(`eventExperience:grid.sortOptions.${o.labelKey}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
