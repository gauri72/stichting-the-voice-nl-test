import { describe, expect, it } from "vitest";
import { addBusinessDays } from "../src/services/businessOrderService.js";
import {
  VCOMMERCE_PLATFORM_FEE_PERCENT,
  VCOMMERCE_PLANS,
  VCOMMERCE_PROMOTIONS,
} from "../src/config/vcommercePlans.js";
import BusinessApplication from "../src/models/BusinessApplication.js";
import BusinessProfile from "../src/models/BusinessProfile.js";
import BusinessOrder from "../src/models/BusinessOrder.js";
import VCommerceAdjustment from "../src/models/VCommerceAdjustment.js";
import VCommerceChargeRule from "../src/models/VCommerceChargeRule.js";
import VCommerceLedgerEntry from "../src/models/VCommerceLedgerEntry.js";
import VCommerceRiskFlag from "../src/models/VCommerceRiskFlag.js";

describe("V.Commerce commercial rules", () => {
  it("uses the agreed affordable package prices", () => {
    expect(VCOMMERCE_PLANS.starter.monthlyMinor).toBe(699);
    expect(VCOMMERCE_PLANS.growth.monthlyMinor).toBe(1499);
    expect(VCOMMERCE_PLANS.spotlight.monthlyMinor).toBe(2999);
  });

  it("uses a five percent hosted-sale fee", () => {
    expect(VCOMMERCE_PLATFORM_FEE_PERCENT).toBe(5);
  });

  it("contains social promotion without a newsletter product", () => {
    expect(VCOMMERCE_PROMOTIONS.social_media.name).toBe("Social Media Promotion");
    expect(Object.values(VCOMMERCE_PROMOTIONS).some((promotion) => /newsletter/i.test(promotion.name))).toBe(false);
  });

  it("schedules five business days while skipping weekends", () => {
    const friday = new Date("2026-07-17T12:00:00.000Z");
    expect(addBusinessDays(friday, 5).toISOString()).toBe("2026-07-24T12:00:00.000Z");

    const monday = new Date("2026-07-20T12:00:00.000Z");
    expect(addBusinessDays(monday, 5).toISOString()).toBe("2026-07-27T12:00:00.000Z");
  });

  it("keeps payment, setup, review and publication as separate lifecycle states", () => {
    expect(BusinessApplication.schema.path("status").enumValues).toEqual([
      "payment_pending", "setup", "pending", "approved", "rejected",
    ]);
    expect(BusinessProfile.schema.path("status").enumValues).toEqual([
      "setup", "review", "active", "suspended", "paused",
    ]);
  });

  it("supports auditable charges, waivers, credits and deductions", () => {
    expect(VCommerceChargeRule.schema.path("chargeType").enumValues).toContain("platform_fee");
    expect(VCommerceAdjustment.schema.path("kind").enumValues).toEqual([
      "waiver", "credit", "deduction", "refund", "manual_charge",
    ]);
    expect(VCommerceLedgerEntry.schema.path("direction").enumValues).toEqual(["credit", "debit"]);
    expect(BusinessOrder.schema.path("calculationSnapshot")).toBeTruthy();
  });

  it("supports operational risk and compliance workflows", () => {
    expect(VCommerceRiskFlag.schema.path("severity").enumValues).toEqual([
      "low", "medium", "high", "critical",
    ]);
    expect(VCommerceRiskFlag.schema.path("status").enumValues).toEqual([
      "open", "reviewing", "resolved", "dismissed",
    ]);
  });
});
