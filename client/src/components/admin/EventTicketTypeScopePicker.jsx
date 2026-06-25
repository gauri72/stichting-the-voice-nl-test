import { useEffect, useMemo, useState } from "react";
import { adminAuthHeaders, apiFetch } from "../../utils/api.js";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import "../../styles/admin-scope-picker.css";

/**
 * Two flat dropdowns — "Select Events" and "Select Ticket Type" — for scoping a discount,
 * voucher, or membership discount. Internally still produces the precise
 * { applyToAllEvents, eventScopes: [{ eventId, applyToAllTicketTypes, ticketTypeIds }] }
 * shape the backend validates against (see discountService.js's appliesToEventAndTicketType),
 * so per-event-per-ticket-type precision is preserved even though the UI is a flat pair of
 * pickers rather than a per-event card list.
 *
 * Convention: an empty "Select Events" selection means "all events" (applyToAllEvents: true),
 * matching the legacy empty-array convention. An empty "Select Ticket Type" selection, with
 * one or more events selected, means "all ticket types of those events."
 *
 * value shape: { applyToAllEvents: boolean, eventScopes: [{ eventId, applyToAllTicketTypes, ticketTypeIds }] }
 * events: the published-only event list for the "Select Events" dropdown — [{ id, title }]
 */
export default function EventTicketTypeScopePicker({ events, value, onChange }) {
  const { eventScopes } = value;
  const [ticketTypesByEvent, setTicketTypesByEvent] = useState({});

  const selectedEventIds = useMemo(() => eventScopes.map((s) => s.eventId), [eventScopes]);

  useEffect(() => {
    selectedEventIds.forEach((eventId) => {
      if (ticketTypesByEvent[eventId] !== undefined) return;
      apiFetch(`/api/admin/events/${eventId}`, { headers: adminAuthHeaders() })
        .then((data) => {
          setTicketTypesByEvent((prev) => ({ ...prev, [eventId]: data.event?.ticketTypes || [] }));
        })
        .catch(() => {
          setTicketTypesByEvent((prev) => ({ ...prev, [eventId]: [] }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventIds]);

  const showEventNameInTicketLabel = selectedEventIds.length > 1;
  const ticketTypeOptions = selectedEventIds.flatMap((eventId) => {
    const event = events.find((ev) => ev.id === eventId);
    const ticketTypes = ticketTypesByEvent[eventId] || [];
    return ticketTypes.map((tt) => ({
      value: tt.id,
      label: showEventNameInTicketLabel ? `${tt.name} — ${event?.title || eventId}` : tt.name,
    }));
  });

  const selectedTicketTypeIds = eventScopes.flatMap((s) => (s.applyToAllTicketTypes ? [] : s.ticketTypeIds));

  function handleEventsChange(newEventIds) {
    if (newEventIds.length === 0) {
      onChange({ applyToAllEvents: true, eventScopes: [] });
      return;
    }
    // Preserve each still-selected event's existing scope; default newly-added events to
    // "all ticket types" until the admin narrows them down via the second dropdown.
    onChange({
      applyToAllEvents: false,
      eventScopes: newEventIds.map((eventId) => {
        const existing = eventScopes.find((s) => s.eventId === eventId);
        return existing || { eventId, applyToAllTicketTypes: true, ticketTypeIds: [] };
      }),
    });
  }

  function handleTicketTypesChange(newTicketTypeIds) {
    if (newTicketTypeIds.length === 0) {
      onChange({
        applyToAllEvents: false,
        eventScopes: selectedEventIds.map((eventId) => ({ eventId, applyToAllTicketTypes: true, ticketTypeIds: [] })),
      });
      return;
    }
    onChange({
      applyToAllEvents: false,
      eventScopes: selectedEventIds.map((eventId) => {
        const ticketTypeIdsForEvent = (ticketTypesByEvent[eventId] || [])
          .map((tt) => tt.id)
          .filter((id) => newTicketTypeIds.includes(id));
        // None of the globally-selected ticket types belong to this event — rather than
        // silently scoping this event to nothing, treat it as "all ticket types of this
        // event" so selecting events first and ticket types second never creates a dead zone.
        return ticketTypeIdsForEvent.length > 0
          ? { eventId, applyToAllTicketTypes: false, ticketTypeIds: ticketTypeIdsForEvent }
          : { eventId, applyToAllTicketTypes: true, ticketTypeIds: [] };
      }),
    });
  }

  return (
    <div className="scope-picker">
      <MultiSelectDropdown
        label="Select Events"
        placeholder="All events (site-wide)"
        options={events.map((ev) => ({ value: ev.id, label: ev.title }))}
        selected={selectedEventIds}
        onChange={handleEventsChange}
      />
      <MultiSelectDropdown
        label="Select Ticket Type"
        placeholder={selectedEventIds.length === 0 ? "All ticket types" : "All ticket types of the selected event(s)"}
        options={ticketTypeOptions}
        selected={selectedTicketTypeIds}
        onChange={handleTicketTypesChange}
        disabled={selectedEventIds.length === 0}
      />
    </div>
  );
}
