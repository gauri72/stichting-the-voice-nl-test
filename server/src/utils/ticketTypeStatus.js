export const TICKET_TYPE_STATUSES = [
  "AVAILABLE",
  "FUTURE_AVAILABLE",
  "SALES_DISABLED",
  "SOLD_OUT",
  "EXPIRED",
  "HIDDEN",
];

const STATUS_SORT_ORDER = {
  AVAILABLE: 0,
  FUTURE_AVAILABLE: 1,
  SOLD_OUT: 2,
  SALES_DISABLED: 3,
  EXPIRED: 4,
  HIDDEN: 5,
};

export function resolveAvailableFrom(tt) {
  return tt?.availableFrom || tt?.saleStartDate || null;
}

export function resolveAvailableUntil(tt) {
  return tt?.availableUntil || tt?.saleEndDate || null;
}

export function resolveShowPublicly(tt) {
  if (tt?.showPublicly === false) return false;
  if (tt?.status === "hidden") return false;
  return true;
}

export function formatTicketTypeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function computeTicketTypeStatus(tt, now = new Date()) {
  const availableFrom = resolveAvailableFrom(tt);
  const availableUntil = resolveAvailableUntil(tt);
  const available = Math.max(0, (tt?.capacity || 0) - (tt?.soldCount || 0));
  const salesEnabled = tt?.salesEnabled !== false;
  const showPublicly = resolveShowPublicly(tt);

  if (!showPublicly) return "HIDDEN";
  if (availableUntil && now > new Date(availableUntil)) return "EXPIRED";
  if (available <= 0 || tt?.status === "sold_out") return "SOLD_OUT";
  if (!salesEnabled) return "SALES_DISABLED";
  if (availableFrom && now < new Date(availableFrom)) return "FUTURE_AVAILABLE";
  return "AVAILABLE";
}

export function hasAvailableFromStarted(tt, now = new Date()) {
  const availableFrom = resolveAvailableFrom(tt);
  if (!availableFrom) return true;
  return now >= new Date(availableFrom);
}

export function getTicketTypeDisplayLabel(tt, computedStatus, now = new Date()) {
  const availableFrom = resolveAvailableFrom(tt);
  const availableUntil = resolveAvailableUntil(tt);
  const fromStarted = hasAvailableFromStarted(tt, now);

  if (fromStarted && availableUntil && computedStatus !== "EXPIRED") {
    return `Available until ${formatTicketTypeDate(availableUntil)}`;
  }

  if (!fromStarted && tt?.futureDisplayLabel?.trim()) {
    return tt.futureDisplayLabel.trim();
  }

  switch (computedStatus) {
    case "FUTURE_AVAILABLE":
      return availableFrom
        ? `Available from ${formatTicketTypeDate(availableFrom)}`
        : "";
    case "SALES_DISABLED":
      return "Sales for this ticket type are currently disabled.";
    case "EXPIRED":
      return availableUntil
        ? `Offer ended on ${formatTicketTypeDate(availableUntil)}`
        : "This ticket type is no longer available.";
    case "SOLD_OUT":
      return tt?.soldOutDisplayMode === "waitlist"
        ? "Sold out — join the waitlist"
        : "Sold out";
    case "AVAILABLE":
      return "";
    default:
      return "";
  }
}

export function getTicketTypeBadge(computedStatus) {
  switch (computedStatus) {
    case "SALES_DISABLED":
      return "Sales Paused";
    case "EXPIRED":
      return "Offer Ended";
    case "SOLD_OUT":
      return "Sold Out";
    default:
      return "";
  }
}

export function isTicketTypeSelectable(computedStatus) {
  return computedStatus === "AVAILABLE";
}

export function isTicketTypePubliclyVisible(tt, computedStatus) {
  if (computedStatus === "HIDDEN") return false;
  if (tt?.hideUntilAvailable && computedStatus === "FUTURE_AVAILABLE") return false;
  if (computedStatus === "SOLD_OUT" && tt?.soldOutDisplayMode === "hide") return false;
  if (computedStatus === "EXPIRED") return false;
  return true;
}

export function enrichTicketType(tt, now = new Date()) {
  const available = Math.max(0, (tt?.capacity || 0) - (tt?.soldCount || 0));
  const computedStatus = computeTicketTypeStatus(tt, now);
  const displayLabel = getTicketTypeDisplayLabel(tt, computedStatus, now);
  const badge = getTicketTypeBadge(computedStatus);
  const selectable = isTicketTypeSelectable(computedStatus);

  return {
    ...tt,
    availableFrom: resolveAvailableFrom(tt),
    availableUntil: resolveAvailableUntil(tt),
    saleStartDate: resolveAvailableFrom(tt),
    saleEndDate: resolveAvailableUntil(tt),
    showPublicly: resolveShowPublicly(tt),
    salesEnabled: tt?.salesEnabled !== false,
    hideUntilAvailable: Boolean(tt?.hideUntilAvailable),
    futureDisplayLabel: tt?.futureDisplayLabel || "",
    soldOutDisplayMode: tt?.soldOutDisplayMode || "show",
    available,
    remainingCapacity: available,
    computedStatus,
    displayLabel,
    badge,
    selectable,
    publiclyVisible: isTicketTypePubliclyVisible(tt, computedStatus),
  };
}

export function sortTicketTypesForPublic(ticketTypes = []) {
  return [...ticketTypes].sort((a, b) => {
    const statusDiff =
      (STATUS_SORT_ORDER[a.computedStatus] ?? 99) - (STATUS_SORT_ORDER[b.computedStatus] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function assertTicketTypePurchasable(tt, event) {
  if (!event || event.status !== "published") {
    const err = new Error("This event is not available for ticket sales.");
    err.status = 400;
    throw err;
  }
  if (!event.salesEnabled) {
    const err = new Error("Ticket sales are not enabled for this event.");
    err.status = 400;
    throw err;
  }

  const computedStatus = tt.computedStatus || computeTicketTypeStatus(tt);

  if (computedStatus === "HIDDEN") {
    const err = new Error("This ticket type is not available.");
    err.status = 400;
    throw err;
  }
  if (computedStatus === "FUTURE_AVAILABLE") {
    const err = new Error("This ticket type is not available for sale yet.");
    err.status = 400;
    throw err;
  }
  if (computedStatus === "SALES_DISABLED") {
    const err = new Error("Sales for this ticket type are currently disabled.");
    err.status = 400;
    throw err;
  }
  if (computedStatus === "EXPIRED") {
    const err = new Error("This ticket type is no longer available.");
    err.status = 400;
    throw err;
  }
  if (computedStatus === "SOLD_OUT") {
    const err = new Error(`${tt.name} is sold out.`);
    err.status = 400;
    throw err;
  }
}
