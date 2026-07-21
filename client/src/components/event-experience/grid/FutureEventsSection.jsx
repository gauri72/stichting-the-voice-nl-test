import { useTranslation } from "react-i18next";
import useUpcomingEvents from "./useUpcomingEvents.js";
import FilterBar from "./FilterBar.jsx";
import EventSearchBar from "./EventSearchBar.jsx";
import SortControl from "./SortControl.jsx";
import EventsGrid from "./EventsGrid.jsx";
import LoadMoreButton from "./LoadMoreButton.jsx";
import EmptyState from "./EmptyState.jsx";
import { useEventExperience } from "../EventExperienceContext.jsx";

export default function FutureEventsSection() {
  const { t } = useTranslation(["eventExperience"]);
  const {
    events,
    facets,
    loading,
    loadingMore,
    error,
    filters,
    updateFilter,
    clearFilters,
    search,
    setSearch,
    sort,
    setSort,
    loadMore,
    hasMore,
    totalCount,
  } = useUpcomingEvents();
  const { scrollToShort } = useEventExperience();

  return (
    <section aria-label={t("eventExperience:grid.sectionAriaLabel")} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-2 text-2xl font-extrabold text-evx-heading sm:text-3xl">{t("eventExperience:grid.sectionTitle")}</h2>
      <p className="mb-6 text-sm text-evx-text-muted">
        {t("eventExperience:grid.upcomingCount", { count: totalCount })}
      </p>

      <div className="mb-6 flex flex-col gap-4">
        <EventSearchBar value={search} onChange={setSearch} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar filters={filters} updateFilter={updateFilter} facets={facets} clearFilters={clearFilters} />
          <SortControl value={sort} onChange={setSort} />
        </div>
      </div>

      {error ? <p className="py-8 text-center text-sm text-red-500">{error}</p> : null}

      {!loading && !error && !events.length ? (
        <EmptyState onClearFilters={clearFilters} />
      ) : (
        <EventsGrid events={events} loading={loading} onWatchShort={(e) => scrollToShort(e.id)} />
      )}

      {!loading && hasMore ? <LoadMoreButton onClick={loadMore} loading={loadingMore} /> : null}
    </section>
  );
}
