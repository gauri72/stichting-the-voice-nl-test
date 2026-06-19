export const BOOKING_STATUS_LABELS = {
  NOT_BOOKED: null,
  BOOKED: "Tickets Purchased",
  CHECKED_IN: "Attended",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const EVENT_FILTERS = [
  { id: "all", label: "All Events" },
  { id: "featured", label: "Featured" },
  { id: "upcoming", label: "Upcoming" },
  { id: "booked", label: "Booked" },
  { id: "attended", label: "Attended" },
  { id: "membership", label: "Included in Membership" },
];

export function slugifyFilename(text) {
  return String(text || "event")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "event";
}

export function filterEvents(events, { filter, search }) {
  const q = String(search || "").trim().toLowerCase();
  let list = [...(events || [])];

  if (filter === "featured") list = list.filter((e) => e.isFeatured);
  else if (filter === "upcoming") list = list.filter((e) => e.isUpcoming);
  else if (filter === "booked") list = list.filter((e) => e.bookingStatus === "BOOKED" || e.bookingStatus === "CHECKED_IN");
  else if (filter === "attended") list = list.filter((e) => e.bookingStatus === "CHECKED_IN");
  else if (filter === "membership") list = list.filter((e) => e.hasMembershipBenefit);

  if (q) {
    list = list.filter((e) => {
      const haystack = [e.title, e.venueName, e.location, e.venueAddress, e.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return list;
}

export function canViewTickets(event) {
  return event?.hasPurchasedTicket === true;
}

export function viewTicketsLabel(event) {
  return canViewTickets(event) ? "View Tickets" : "No Tickets Purchased";
}
