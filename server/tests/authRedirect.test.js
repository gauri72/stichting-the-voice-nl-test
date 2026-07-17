import { describe, expect, it } from "vitest";
import {
  buildLoginUrl,
  getReturnTo,
  isSafeInternalReturnPath,
} from "../../client/src/utils/authRedirect.js";

describe("authentication return journeys", () => {
  it("accepts the canonical returnTo parameter", () => {
    const params = new URLSearchParams({ returnTo: "/vcommerce/apply" });
    expect(getReturnTo(params)).toBe("/vcommerce/apply");
  });

  it("supports legacy return links during migration", () => {
    const params = new URLSearchParams({ return: "/vcommerce/checkout?business=123#payment" });
    expect(getReturnTo(params)).toBe("/vcommerce/checkout?business=123#payment");
  });

  it("preserves query strings and hashes in generated login links", () => {
    const url = buildLoginUrl("/vcommerce/checkout?business=123#payment", {
      journey: "vcommerce-checkout",
    });
    const parsed = new URL(url, "https://voice.test");
    expect(parsed.searchParams.get("returnTo")).toBe("/vcommerce/checkout?business=123#payment");
    expect(parsed.searchParams.get("journey")).toBe("vcommerce-checkout");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(isSafeInternalReturnPath("https://malicious.test")).toBe(false);
    expect(isSafeInternalReturnPath("//malicious.test")).toBe(false);
    expect(isSafeInternalReturnPath("/\\malicious.test")).toBe(false);
    expect(getReturnTo(new URLSearchParams({ returnTo: "//malicious.test" }))).toBe("/dashboard");
  });

  it("uses protected-route state when no query destination exists", () => {
    expect(getReturnTo(new URLSearchParams(), {
      from: "/dashboard/vcommerce?tab=payouts#status",
    })).toBe("/dashboard/vcommerce?tab=payouts#status");
  });
});
