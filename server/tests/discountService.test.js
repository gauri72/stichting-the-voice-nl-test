import { describe, it, expect } from "vitest";
import {
  appliesToEventAndTicketType,
  calculateDiscountAmount,
  resolveStackedDiscounts,
} from "../src/services/discountService.js";

const EVENT_A = "650000000000000000000001";
const EVENT_B = "650000000000000000000002";
const VIP = "650000000000000000000011";
const GENERAL = "650000000000000000000012";
const OTHER_EVENT_TICKET = "650000000000000000000013";

describe("appliesToEventAndTicketType", () => {
  it("matches any event/ticket type when applyToAllEvents is set", () => {
    const rule = { applyToAllEvents: true, eventScopes: [] };
    expect(appliesToEventAndTicketType(rule, EVENT_A, VIP)).toBe(true);
    expect(appliesToEventAndTicketType(rule, EVENT_B, GENERAL)).toBe(true);
  });

  it("matches no eventId at all (order-level call without an event)", () => {
    const rule = { applyToAllEvents: false, eventScopes: [{ eventId: EVENT_A, applyToAllTicketTypes: true }] };
    expect(appliesToEventAndTicketType(rule, null, null)).toBe(true);
  });

  it("event-scoped + applyToAllTicketTypes matches any ticket type of that event only", () => {
    const rule = {
      applyToAllEvents: false,
      eventScopes: [{ eventId: EVENT_A, applyToAllTicketTypes: true, ticketTypeIds: [] }],
    };
    expect(appliesToEventAndTicketType(rule, EVENT_A, VIP)).toBe(true);
    expect(appliesToEventAndTicketType(rule, EVENT_A, GENERAL)).toBe(true);
    expect(appliesToEventAndTicketType(rule, EVENT_B, GENERAL)).toBe(false);
  });

  it("event-scoped with explicit ticketTypeIds matches only those IDs", () => {
    const rule = {
      applyToAllEvents: false,
      eventScopes: [{ eventId: EVENT_A, applyToAllTicketTypes: false, ticketTypeIds: [VIP] }],
    };
    expect(appliesToEventAndTicketType(rule, EVENT_A, VIP)).toBe(true);
    expect(appliesToEventAndTicketType(rule, EVENT_A, GENERAL)).toBe(false);
  });

  it("does not leak a ticket type into an unrelated event scope, even if listed elsewhere", () => {
    const rule = {
      applyToAllEvents: false,
      eventScopes: [
        { eventId: EVENT_A, applyToAllTicketTypes: false, ticketTypeIds: [VIP] },
        { eventId: EVENT_B, applyToAllTicketTypes: false, ticketTypeIds: [OTHER_EVENT_TICKET] },
      ],
    };
    // VIP belongs to event A's scope only — must not match when checked against event B.
    expect(appliesToEventAndTicketType(rule, EVENT_B, VIP)).toBe(false);
  });

  it("ticket-type-scoped rule with no ticketTypeId provided does not match", () => {
    const rule = {
      applyToAllEvents: false,
      eventScopes: [{ eventId: EVENT_A, applyToAllTicketTypes: false, ticketTypeIds: [VIP] }],
    };
    expect(appliesToEventAndTicketType(rule, EVENT_A, null)).toBe(false);
  });

  it("falls back to legacy eligibleEventIds when eventScopes is empty and the array is populated", () => {
    const rule = { applyToAllEvents: false, eventScopes: [], eligibleEventIds: [EVENT_A] };
    expect(appliesToEventAndTicketType(rule, EVENT_A, VIP)).toBe(true);
    expect(appliesToEventAndTicketType(rule, EVENT_B, VIP)).toBe(false);
  });

  it("falls back to legacy 'all events' semantics when eventScopes and eligibleEventIds are both empty", () => {
    // This is the pre-migration default: an empty eligibleEventIds historically meant "all
    // events," not "no events" — appliesToEventAndTicketType() must replicate that exactly
    // for any rule not yet migrated, rather than failing closed.
    const rule = { applyToAllEvents: false, eventScopes: [], eligibleEventIds: [] };
    expect(appliesToEventAndTicketType(rule, EVENT_A, VIP)).toBe(true);
  });

  it("treats a missing eligibleEventIds the same as an empty one (legacy 'all events' fallback)", () => {
    const rule = { applyToAllEvents: false, eventScopes: [] };
    expect(appliesToEventAndTicketType(rule, EVENT_A, VIP)).toBe(true);
  });
});

describe("calculateDiscountAmount", () => {
  it("applies a percentage discount", () => {
    expect(calculateDiscountAmount(10000, { discountType: "percentage", discountValue: 20 })).toBe(2000);
  });

  it("applies a fixed amount discount, capped at the subtotal", () => {
    expect(calculateDiscountAmount(500, { discountType: "fixed_amount", discountValue: 20 })).toBe(500);
  });

  it("treats free_ticket as 100% off", () => {
    expect(calculateDiscountAmount(5000, { discountType: "free_ticket", discountValue: 0 })).toBe(5000);
  });

  it("returns 0 for a non-positive subtotal", () => {
    expect(calculateDiscountAmount(0, { discountType: "percentage", discountValue: 50 })).toBe(0);
  });
});

describe("resolveStackedDiscounts", () => {
  it("stacks member and code discounts by default", () => {
    const result = resolveStackedDiscounts({
      subtotalMinor: 10000,
      memberRule: { discountType: "percentage", discountValue: 10, label: "Member" },
      codeRule: { discountType: "percentage", discountValue: 10, label: "Code", type: "campaign_code" },
    });
    expect(result.memberDiscountMinor).toBe(1000);
    // Code discount applies to the remaining 9000 after member discount.
    expect(result.codeDiscountMinor).toBe(900);
    expect(result.discountAmountMinor).toBe(1900);
  });

  it("applies only the member discount when no code is present", () => {
    const result = resolveStackedDiscounts({
      subtotalMinor: 10000,
      memberRule: { discountType: "percentage", discountValue: 15, label: "Member" },
      codeRule: null,
    });
    expect(result.memberDiscountMinor).toBe(1500);
    expect(result.codeDiscountMinor).toBe(0);
  });
});
