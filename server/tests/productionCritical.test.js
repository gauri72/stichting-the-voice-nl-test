import { describe, expect, it } from "vitest";
import {
  freeOrderPaymentReference,
  isOrderPaymentSettled,
  SETTLED_PAYMENT_STATUSES,
} from "../src/utils/orderPaymentUtils.js";
import { hasPermission } from "../src/config/rbacConfig.js";

describe("orderPaymentUtils", () => {
  it("recognises settled payment statuses", () => {
    expect(isOrderPaymentSettled("paid")).toBe(true);
    expect(isOrderPaymentSettled("free")).toBe(true);
    expect(isOrderPaymentSettled("pending")).toBe(false);
    expect(isOrderPaymentSettled("processing")).toBe(false);
    expect(SETTLED_PAYMENT_STATUSES).toContain("paid");
  });

  it("builds stable free-order payment references", () => {
    expect(freeOrderPaymentReference("abc123")).toBe("free:abc123");
  });
});

describe("rbacConfig.hasPermission", () => {
  it("grants wildcard access", () => {
    expect(hasPermission(["*"], "events.delete")).toBe(true);
  });

  it("grants module wildcard", () => {
    expect(hasPermission(["events.*"], "events.edit")).toBe(true);
  });

  it("denies missing permission", () => {
    expect(hasPermission(["tickets.view"], "events.edit")).toBe(false);
  });
});

describe("adminRoutePermissions", () => {
  it("maps event ticket refund to tickets.refund", async () => {
    const { resolveAdminPermission } = await import("../src/config/adminRoutePermissions.js");
    const req = {
      originalUrl: "/api/admin/events/tickets/abc/refund",
      method: "POST",
    };
    expect(resolveAdminPermission(req)).toBe("tickets.refund");
  });

  it("maps membership list to memberships.view", async () => {
    const { resolveAdminPermission } = await import("../src/config/adminRoutePermissions.js");
    const req = { originalUrl: "/api/admin/memberships", method: "GET" };
    expect(resolveAdminPermission(req)).toBe("memberships.view");
  });
});

describe("ticketPdfAccess", () => {
  it("builds tokenized PDF URLs", async () => {
    const { buildTicketPdfUrl } = await import("../src/utils/ticketPdfAccess.js");
    const url = buildTicketPdfUrl("TKT-2026-1", "secret-token");
    expect(url).toContain("token=secret-token");
    expect(url).toContain("TKT-2026-1");
  });

  it("rejects invalid verification token", async () => {
    const { verifyTicketPdfAccess } = await import("../src/utils/ticketPdfAccess.js");
    expect(() =>
      verifyTicketPdfAccess({ verificationToken: "abc" }, "wrong")
    ).toThrow(/Invalid or missing/);
  });
});

describe("ticketTypeStatus", () => {
  it("marks future ticket types as not selectable", async () => {
    const { computeTicketTypeStatus, isTicketTypeSelectable } = await import("../src/utils/ticketTypeStatus.js");
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const status = computeTicketTypeStatus({
      salesEnabled: true,
      showPublicly: true,
      capacity: 100,
      soldCount: 0,
      availableFrom: future,
    });
    expect(status).toBe("FUTURE_AVAILABLE");
    expect(isTicketTypeSelectable(status)).toBe(false);
  });

  it("marks disabled sales as sales_disabled", async () => {
    const { computeTicketTypeStatus } = await import("../src/utils/ticketTypeStatus.js");
    const status = computeTicketTypeStatus({
      salesEnabled: false,
      showPublicly: true,
      capacity: 100,
      soldCount: 0,
    });
    expect(status).toBe("SALES_DISABLED");
  });

  it("sorts available ticket types before future types", async () => {
    const { sortTicketTypesForPublic } = await import("../src/utils/ticketTypeStatus.js");
    const sorted = sortTicketTypesForPublic([
      { id: "2", computedStatus: "FUTURE_AVAILABLE", sortOrder: 1 },
      { id: "1", computedStatus: "AVAILABLE", sortOrder: 2 },
    ]);
    expect(sorted[0].id).toBe("1");
    expect(sorted[1].id).toBe("2");
  });
});

describe("sanitizeHtml", () => {
  it("strips script tags", async () => {
    const { sanitizeHtml } = await import("../src/services/cmsValidationService.js");
    const out = sanitizeHtml('<p>Hi</p><script>alert(1)</script>');
    expect(out).not.toContain("script");
    expect(out).toContain("Hi");
  });
});
