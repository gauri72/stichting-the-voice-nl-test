/** Supported booking modes across the V.O.I.C.E. NL platform */
export const BOOKING_MODES = Object.freeze({
  TICKETED_EVENT: "ticketed_event",
  FREE_EVENT: "free_event",
  RSVP_EVENT: "rsvp_event",
  RESERVED_SEATING: "reserved_seating",
  GROUP_BOOKING: "group_booking",
  FAMILY_BOOKING: "family_booking",
  WORKSHOP: "workshop",
  FITNESS_SLOT: "fitness_slot",
  RESTAURANT: "restaurant",
  WAITLIST: "waitlist",
  COMPLIMENTARY: "complimentary",
  FESTIVAL_PASS: "festival_pass",
  MEMBERSHIP_AWARE: "membership_aware",
  VOUCHER: "voucher",
  PREMIUM_FREE: "premium_free",
  GUEST: "guest",
});

/** Standard checkout workflow steps */
export const BOOKING_STEPS = Object.freeze({
  SELECT_TICKETS: "select_tickets",
  CHECKOUT_DETAILS: "checkout_details",
  MEMBERSHIP_DETECTION: "membership_detection",
  MEMBERSHIP_UPSELL: "membership_upsell",
  REVIEW: "review",
  PAYMENT: "payment",
  COMPLETE: "complete",
});

/** Flow families routed through BookingFlowResolver */
export const BOOKING_FLOW_TYPES = Object.freeze({
  EVENT_TICKET: "event_ticket",
  SESSION: "session",
  RSVP: "rsvp",
  WAITLIST: "waitlist",
  COMPLIMENTARY: "complimentary",
  FESTIVAL_PASS: "festival_pass",
});

export const DEFAULT_CHECKOUT_STEPS = [
  BOOKING_STEPS.SELECT_TICKETS,
  BOOKING_STEPS.CHECKOUT_DETAILS,
  BOOKING_STEPS.MEMBERSHIP_DETECTION,
  BOOKING_STEPS.MEMBERSHIP_UPSELL,
  BOOKING_STEPS.REVIEW,
  BOOKING_STEPS.PAYMENT,
  BOOKING_STEPS.COMPLETE,
];

export const RSVP_STEPS = [
  "open_rsvp",
  "submit_response",
  "confirmation",
];

export const SESSION_STEPS = [
  BOOKING_STEPS.SELECT_TICKETS,
  BOOKING_STEPS.CHECKOUT_DETAILS,
  BOOKING_STEPS.REVIEW,
  BOOKING_STEPS.PAYMENT,
  BOOKING_STEPS.COMPLETE,
];
