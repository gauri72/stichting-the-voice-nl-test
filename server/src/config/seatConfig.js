export const SEAT_STATUSES = ["available", "held", "booked", "blocked", "reserved", "disabled"];
export const SEAT_CATEGORIES = ["regular", "premium", "vip", "wheelchair", "companion", "staff", "blocked"];
export const SEATING_MODES = ["general_admission", "reserved_seating", "mixed_seating"];

export const SEAT_AUDIT_ACTIONS = {
  SEAT_MAP_CREATED: "seat_map_created",
  SEAT_MAP_IMAGE_UPLOADED: "seat_map_image_uploaded",
  SEAT_CREATED: "seat_created",
  SEATS_BULK_CREATED: "seats_bulk_created",
  SEAT_UPDATED: "seat_updated",
  SEAT_MOVED: "seat_moved",
  SEAT_BLOCKED: "seat_blocked",
  SEAT_UNBLOCKED: "seat_unblocked",
  SEAT_HELD: "seat_held",
  SEAT_HOLD_EXPIRED: "seat_hold_expired",
  SEAT_BOOKED: "seat_booked",
  SEAT_RELEASED: "seat_released",
  SEAT_CHANGED_ADMIN: "seat_changed_admin",
  TICKET_PDF_REGENERATED: "ticket_pdf_regenerated_seat_change",
};

export const DEFAULT_SEAT_MAP_SETTINGS = {
  enableReservedSeating: false,
  seatingMode: "general_admission",
  allowCustomerSeatSelection: true,
  autoAssignSeats: false,
  holdSeatsDuringCheckout: true,
  seatHoldMinutes: 10,
  allowAdminBlockSeats: true,
  stageLabel: "Screen / Stage",
  seatingInstructions: "",
};

export function defaultSeatLabel(row, seatNumber) {
  return `${row}${seatNumber}`;
}
