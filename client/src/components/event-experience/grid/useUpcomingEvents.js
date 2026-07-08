import { useCallback, useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../shared/eventExperienceApi.js";
import useDebouncedValue from "./useDebouncedValue.js";

export const CATEGORY_OPTIONS = ["Music", "Culture", "Sports", "Community", "Festivals", "Workshops"];

const DEFAULT_FILTERS = { category: "", priceFilter: "all", location: "", hasVideo: false, dateFrom: "", dateTo: "" };
const PAGE_SIZE = 12;

export default function useUpcomingEvents() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [events, setEvents] = useState([]);
  const [facets, setFacets] = useState({ categories: [], locations: [] });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(
    (targetPage, append) => {
      const setLoadingState = append ? setLoadingMore : setLoading;
      setLoadingState(true);
      setError("");
      fetchUpcomingEvents({ ...filters, search: debouncedSearch, sort, page: targetPage, pageSize: PAGE_SIZE })
        .then((data) => {
          setEvents((prev) => (append ? [...prev, ...(data.events || [])] : data.events || []));
          setFacets(data.facets || { categories: [], locations: [] });
          setTotalCount(data.totalCount || 0);
          setTotalPages(data.totalPages || 1);
          setPage(data.page || 1);
        })
        .catch((err) => setError(err.message || "Could not load events."))
        .finally(() => setLoadingState(false));
    },
    [filters, debouncedSearch, sort]
  );

  useEffect(() => {
    load(1, false);
    // Re-fetch from page 1 whenever a filter/search/sort changes — load
    // itself is memoized off the same deps, so this stays in sync.
  }, [load]);

  function loadMore() {
    if (page < totalPages) load(page + 1, true);
  }

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  }

  return {
    events,
    facets,
    totalCount,
    totalPages,
    page,
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
    hasMore: page < totalPages,
  };
}
