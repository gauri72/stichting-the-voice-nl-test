import { apiFetch, authHeaders } from "../../../utils/api.js";

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function fetchFeaturedEvents({ limit } = {}) {
  return apiFetch(`/api/event-experience/featured${toQueryString({ limit })}`);
}

export function fetchUpcomingEvents(params = {}) {
  return apiFetch(`/api/event-experience/upcoming${toQueryString(params)}`);
}

export function fetchEventShorts() {
  return apiFetch("/api/event-experience/shorts");
}

export function fetchCalendarMonth(year, month) {
  return apiFetch(`/api/event-experience/calendar${toQueryString({ year, month })}`);
}

export function fetchSavedEventIds() {
  return apiFetch("/api/event-experience/saved", { headers: authHeaders() });
}

export function saveEventRequest(eventId) {
  return apiFetch(`/api/event-experience/saved/${eventId}`, { method: "POST", headers: authHeaders() });
}

export function unsaveEventRequest(eventId) {
  return apiFetch(`/api/event-experience/saved/${eventId}`, { method: "DELETE", headers: authHeaders() });
}

export function bulkSaveEventsRequest(eventIds) {
  return apiFetch("/api/event-experience/saved/bulk", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ eventIds }),
  });
}
