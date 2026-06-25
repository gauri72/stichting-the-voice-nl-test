import { describe, it, expect } from "vitest";
import {
  buildConsentRecord,
  isConsentRecordExpired,
  normalizeCategories,
  validateConsentPayload,
} from "../src/services/cookieConsentService.js";

describe("normalizeCategories", () => {
  it("forces necessary to always be true", () => {
    expect(normalizeCategories({ necessary: false }).necessary).toBe(true);
  });

  it("defaults missing optional categories to false", () => {
    expect(normalizeCategories(undefined)).toEqual({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  });

  it("coerces truthy/falsy values to booleans", () => {
    expect(normalizeCategories({ functional: 1, analytics: "yes", marketing: 0 })).toEqual({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: false,
    });
  });
});

describe("validateConsentPayload", () => {
  it("rejects an unknown method", () => {
    expect(validateConsentPayload({ method: "maybe", anonymousId: "abc" })).toMatch(/method/);
  });

  it("requires either userId or anonymousId", () => {
    expect(validateConsentPayload({ method: "accept_all" })).toMatch(/userId or anonymousId/);
  });

  it("passes with a valid method and anonymousId", () => {
    expect(validateConsentPayload({ method: "accept_all", anonymousId: "abc" })).toBeNull();
  });

  it("passes with a valid method and userId", () => {
    expect(validateConsentPayload({ method: "reject_all", userId: "507f1f77bcf86cd799439011" })).toBeNull();
  });
});

describe("buildConsentRecord", () => {
  it("uses the resolved userId and drops anonymousId when a user is logged in", () => {
    const record = buildConsentRecord({
      body: { method: "accept_all", anonymousId: "anon-1", categories: { analytics: true } },
      userId: "507f1f77bcf86cd799439011",
      ipAddress: "1.2.3.4",
      userAgent: "vitest",
    });
    expect(record.userId).toBe("507f1f77bcf86cd799439011");
    expect(record.anonymousId).toBeNull();
    expect(record.categories).toEqual({
      necessary: true,
      functional: false,
      analytics: true,
      marketing: false,
    });
  });

  it("keeps anonymousId when there is no logged-in user", () => {
    const record = buildConsentRecord({
      body: { method: "reject_all", anonymousId: "anon-1" },
      userId: null,
      ipAddress: "1.2.3.4",
      userAgent: "vitest",
    });
    expect(record.userId).toBeNull();
    expect(record.anonymousId).toBe("anon-1");
  });

  it("defaults doNotSell to false and stamps the consent version", () => {
    const record = buildConsentRecord({
      body: { method: "accept_all", anonymousId: "anon-1" },
      userId: null,
    });
    expect(record.doNotSell).toBe(false);
    expect(record.consentVersion).toBe("1.0");
  });
});

describe("isConsentRecordExpired", () => {
  it("treats a missing record as expired", () => {
    expect(isConsentRecordExpired(null)).toBe(true);
  });

  it("is not expired just under 12 months old", () => {
    const elevenMonthsAgo = Date.now() - 11 * 30 * 24 * 60 * 60 * 1000;
    expect(isConsentRecordExpired({ createdAt: new Date(elevenMonthsAgo) })).toBe(false);
  });

  it("is expired past 12 months old", () => {
    const thirteenMonthsAgo = Date.now() - 13 * 30 * 24 * 60 * 60 * 1000;
    expect(isConsentRecordExpired({ createdAt: new Date(thirteenMonthsAgo) })).toBe(true);
  });
});
