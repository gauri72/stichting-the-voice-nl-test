import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import FilterPill from "./FilterPill.jsx";
import DateRangePicker from "./DateRangePicker.jsx";
import { CATEGORY_OPTIONS } from "./useUpcomingEvents.js";

// Maps the raw filter values in CATEGORY_OPTIONS (sent to the API as-is)
// to their translation keys under grid.filterBar.categories.
const CATEGORY_LABEL_KEYS = {
  Music: "music",
  Culture: "culture",
  Sports: "sports",
  Community: "community",
  Festivals: "festivals",
  Workshops: "workshops",
};

export default function FilterBar({ filters, updateFilter, facets, clearFilters }) {
  const { t } = useTranslation(["eventExperience"]);
  const hasActiveFilters = Boolean(
    filters.category || filters.priceFilter !== "all" || filters.location || filters.hasVideo || filters.dateFrom || filters.dateTo
  );

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <FilterPill label={t("eventExperience:grid.filterBar.allCategories")} active={!filters.category} onClick={() => updateFilter("category", "")} />
      {CATEGORY_OPTIONS.map((cat) => (
        <FilterPill
          key={cat}
          label={
            CATEGORY_LABEL_KEYS[cat]
              ? t(`eventExperience:grid.filterBar.categories.${CATEGORY_LABEL_KEYS[cat]}`)
              : cat
          }
          active={filters.category === cat}
          onClick={() => updateFilter("category", filters.category === cat ? "" : cat)}
        />
      ))}

      <span className="mx-1 h-5 w-px bg-evx-border" aria-hidden="true" />

      <FilterPill label={t("eventExperience:grid.filterBar.allPrices")} active={filters.priceFilter === "all"} onClick={() => updateFilter("priceFilter", "all")} />
      <FilterPill label={t("eventExperience:grid.filterBar.free")} active={filters.priceFilter === "free"} onClick={() => updateFilter("priceFilter", "free")} />
      <FilterPill label={t("eventExperience:grid.filterBar.paid")} active={filters.priceFilter === "paid"} onClick={() => updateFilter("priceFilter", "paid")} />
      <FilterPill label={t("eventExperience:grid.filterBar.hasVideo")} active={filters.hasVideo} onClick={() => updateFilter("hasVideo", !filters.hasVideo)} />

      {facets.locations?.length ? (
        <select
          value={filters.location}
          onChange={(e) => updateFilter("location", e.target.value)}
          aria-label={t("eventExperience:grid.filterBar.locationAriaLabel")}
          className="rounded-full border border-evx-border bg-transparent px-3 py-2 text-sm text-evx-text-secondary"
        >
          <option value="">{t("eventExperience:grid.filterBar.allLocations")}</option>
          {facets.locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      ) : null}

      <DateRangePicker dateFrom={filters.dateFrom} dateTo={filters.dateTo} onChange={updateFilter} />

      <AnimatePresence>
        {hasActiveFilters ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={clearFilters}
            className="text-sm font-semibold text-evx-accent underline-offset-2 hover:underline"
          >
            {t("eventExperience:grid.filterBar.clearFilters")}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
