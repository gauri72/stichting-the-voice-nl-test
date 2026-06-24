import { describe, it, expect } from "vitest";
import {
  BOOKING_MODES,
  BOOKING_FLOW_TYPES,
  BOOKING_STEPS,
  DEFAULT_CHECKOUT_STEPS,
} from "../src/services/booking/bookingTypes.js";
import {
  normalizeCheckoutFields,
  deduplicateCheckoutFields,
} from "../src/services/booking/CheckoutFieldNormalizer.js";
import { resolveBookingSteps } from "../src/services/booking/BookingFlowResolver.js";

describe("bookingTypes", () => {
  it("defines 16 booking modes", () => {
    expect(Object.keys(BOOKING_MODES).length).toBe(16);
  });

  it("defines standard checkout steps", () => {
    expect(DEFAULT_CHECKOUT_STEPS[0]).toBe(BOOKING_STEPS.SELECT_TICKETS);
    expect(DEFAULT_CHECKOUT_STEPS).toContain(BOOKING_STEPS.PAYMENT);
    expect(DEFAULT_CHECKOUT_STEPS).toContain(BOOKING_STEPS.COMPLETE);
  });

  it("defines flow types for routing", () => {
    expect(BOOKING_FLOW_TYPES.EVENT_TICKET).toBe("event_ticket");
    expect(BOOKING_FLOW_TYPES.RSVP).toBe("rsvp");
    expect(BOOKING_FLOW_TYPES.WAITLIST).toBe("waitlist");
  });
});

describe("CheckoutFieldNormalizer", () => {
  it("deduplicates core customer fields", () => {
    const fields = [
      { fieldId: "email", label: "Email", type: "email", order: 1 },
      { fieldId: "email", label: "Email duplicate", type: "email", order: 2 },
      { fieldId: "dietary", label: "Dietary", type: "dropdown", order: 3 },
    ];
    const result = deduplicateCheckoutFields(fields);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.fieldId)).toEqual(["email", "dietary"]);
  });

  it("normalizes field definitions with defaults", () => {
    const [field] = normalizeCheckoutFields([{ label: "Name", type: "text" }]);
    expect(field.label).toBe("Name");
    expect(field.fieldId).toBeTruthy();
    expect(field.required).toBe(false);
    expect(field.showInAdmin).toBe(true);
  });
});

describe("BookingFlowResolver steps", () => {
  it("skips membership detection when logged-in member", () => {
    const steps = resolveBookingSteps(BOOKING_MODES.TICKETED_EVENT, {
      isLoggedIn: true,
      membershipDetected: true,
      showMembershipUpsell: true,
    });
    expect(steps).not.toContain(BOOKING_STEPS.MEMBERSHIP_DETECTION);
    expect(steps).toContain(BOOKING_STEPS.REVIEW);
  });

  it("adds seat selection step for reserved seating", () => {
    const steps = resolveBookingSteps(BOOKING_MODES.RESERVED_SEATING, {
      reservedSeatingEnabled: true,
      showMembershipUpsell: false,
    });
    expect(steps).toContain("select_seats");
    expect(steps).not.toContain(BOOKING_STEPS.MEMBERSHIP_UPSELL);
  });

  it("returns RSVP steps for RSVP mode", () => {
    const steps = resolveBookingSteps(BOOKING_MODES.RSVP_EVENT, {});
    expect(steps).toContain("submit_response");
    expect(steps).toContain("confirmation");
  });

  it("returns waitlist steps", () => {
    const steps = resolveBookingSteps(BOOKING_MODES.WAITLIST, {});
    expect(steps).toEqual(["join_waitlist", "confirmation"]);
  });
});
