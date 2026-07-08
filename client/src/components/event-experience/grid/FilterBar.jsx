import { AnimatePresence, motion } from "framer-motion";
import FilterPill from "./FilterPill.jsx";
import DateRangePicker from "./DateRangePicker.jsx";
import { CATEGORY_OPTIONS } from "./useUpcomingEvents.js";

export default function FilterBar({ filters, updateFilter, facets, clearFilters }) {
  const hasActiveFilters = Boolean(
    filters.category || filters.priceFilter !== "all" || filters.location || filters.hasVideo || filters.dateFrom || filters.dateTo
  );

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <FilterPill label="All Categories" active={!filters.category} onClick={() => updateFilter("category", "")} />
      {CATEGORY_OPTIONS.map((cat) => (
        <FilterPill
          key={cat}
          label={cat}
          active={filters.category === cat}
          onClick={() => updateFilter("category", filters.category === cat ? "" : cat)}
        />
      ))}

      <span className="mx-1 h-5 w-px bg-evx-border" aria-hidden="true" />

      <FilterPill label="All Prices" active={filters.priceFilter === "all"} onClick={() => updateFilter("priceFilter", "all")} />
      <FilterPill label="Free" active={filters.priceFilter === "free"} onClick={() => updateFilter("priceFilter", "free")} />
      <FilterPill label="Paid" active={filters.priceFilter === "paid"} onClick={() => updateFilter("priceFilter", "paid")} />
      <FilterPill label="Has Video" active={filters.hasVideo} onClick={() => updateFilter("hasVideo", !filters.hasVideo)} />

      {facets.locations?.length ? (
        <select
          value={filters.location}
          onChange={(e) => updateFilter("location", e.target.value)}
          aria-label="Filter by location"
          className="rounded-full border border-evx-border bg-transparent px-3 py-2 text-sm text-evx-text-secondary"
        >
          <option value="">All Locations</option>
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
            Clear filters
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
