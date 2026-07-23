import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import {
  assertStripeWebhookScope,
  constructStripeWebhookEvent,
  constructStripeWebhookEventWithScope,
  STRIPE_WEBHOOK_SCOPE,
} from "../src/services/stripe.js";
import { getMissingProductionEnv } from "../src/config/validateProductionEnv.js";
import { buildStripeWebhookConfigurationStatus } from "../src/services/stripeSettingsService.js";

function fakeStripe(
  validSecret,
  event = {
    id: "evt_valid",
    type: "account.updated",
    account: "acct_connected",
  }
) {
  return {
    webhooks: {
      constructEvent: vi.fn((_payload, _signature, secret) => {
        if (secret !== validSecret) throw new Error("Invalid signature");
        return event;
      }),
    },
  };
}

function productionConfig(stripe = {}) {
  return {
    nodeEnv: "production",
    auth: { jwtSecret: "jwt" },
    captcha: { turnstileSecretKey: "turnstile" },
    clientUrlConfigured: true,
    stripe: {
      secretKey: "sk_live_platform",
      webhookSecret: "whsec_platform",
      connectEnabled: false,
      connectWebhookSecret: "",
      ...stripe,
    },
  };
}

describe("Stripe webhook signing secrets", () => {
  it("accepts the existing single platform signing secret", () => {
    const stripe = fakeStripe("whsec_platform");
    const event = constructStripeWebhookEvent(
      stripe,
      Buffer.from("{}"),
      "signature",
      ["whsec_platform"]
    );

    expect(event.id).toBe("evt_valid");
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledTimes(1);
  });

  it("falls back to the connected-account signing secret", () => {
    const stripe = fakeStripe("whsec_connect");
    const event = constructStripeWebhookEvent(
      stripe,
      Buffer.from("{}"),
      "signature",
      ["whsec_platform", "whsec_connect"]
    );

    expect(event.id).toBe("evt_valid");
    expect(stripe.webhooks.constructEvent).toHaveBeenNthCalledWith(
      1,
      expect.any(Buffer),
      "signature",
      "whsec_platform"
    );
    expect(stripe.webhooks.constructEvent).toHaveBeenNthCalledWith(
      2,
      expect.any(Buffer),
      "signature",
      "whsec_connect"
    );
  });

  it("does not retry duplicate or blank signing secrets", () => {
    const stripe = fakeStripe("whsec_connect");
    constructStripeWebhookEvent(
      stripe,
      Buffer.from("{}"),
      "signature",
      ["", "whsec_connect", "whsec_connect"]
    );

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledTimes(1);
  });

  it("rejects the event when neither signing secret verifies it", () => {
    const stripe = fakeStripe("whsec_other");

    expect(() =>
      constructStripeWebhookEvent(
        stripe,
        Buffer.from("{}"),
        "signature",
        ["whsec_platform", "whsec_connect"]
      )
    ).toThrow("Invalid signature");
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledTimes(2);
  });

  it("reports which destination secret verified the request", () => {
    const stripe = fakeStripe("whsec_connect");
    const verified = constructStripeWebhookEventWithScope(
      stripe,
      Buffer.from("{}"),
      "signature",
      [
        { scope: STRIPE_WEBHOOK_SCOPE.PLATFORM, secret: "whsec_platform" },
        { scope: STRIPE_WEBHOOK_SCOPE.CONNECTED, secret: "whsec_connect" },
      ]
    );

    expect(verified.scope).toBe(STRIPE_WEBHOOK_SCOPE.CONNECTED);
    expect(verified.event.id).toBe("evt_valid");
  });

  it("allows the legacy platform secret to authenticate connected events", () => {
    expect(() =>
      assertStripeWebhookScope(
        {
          type: "account.updated",
          account: "acct_connected",
        },
        STRIPE_WEBHOOK_SCOPE.PLATFORM,
        { connectSecretConfigured: false }
      )
    ).not.toThrow();
  });

  it("requires the dedicated secret for connected events once configured", () => {
    expect(() =>
      assertStripeWebhookScope(
        {
          type: "payout.paid",
          account: "acct_connected",
        },
        STRIPE_WEBHOOK_SCOPE.PLATFORM,
        { connectSecretConfigured: true }
      )
    ).toThrow("must use the connected-account webhook secret");
  });

  it("allows documented platform checkout completion events", () => {
    expect(() =>
      assertStripeWebhookScope(
        { type: "checkout.session.completed" },
        STRIPE_WEBHOOK_SCOPE.PLATFORM,
        { connectSecretConfigured: true }
      )
    ).not.toThrow();
  });

  it("blocks a connected secret from authorizing platform fulfillment events", () => {
    expect(() =>
      assertStripeWebhookScope(
        {
          type: "payment_intent.succeeded",
          account: "acct_injected",
        },
        STRIPE_WEBHOOK_SCOPE.CONNECTED,
        { connectSecretConfigured: true }
      )
    ).toThrow("cannot authorize this event");
  });

  it("accepts expected connected events only when Stripe identifies the account", () => {
    expect(() =>
      assertStripeWebhookScope(
        {
          type: "capability.updated",
          account: "acct_connected",
        },
        STRIPE_WEBHOOK_SCOPE.CONNECTED,
        { connectSecretConfigured: true }
      )
    ).not.toThrow();

    expect(() =>
      assertStripeWebhookScope(
        { type: "capability.updated" },
        STRIPE_WEBHOOK_SCOPE.CONNECTED,
        { connectSecretConfigured: true }
      )
    ).toThrow("cannot authorize this event");
  });

  it("enforces scope with a real Stripe signature", () => {
    const stripe = new Stripe("sk_test_scope_test");
    const payload = JSON.stringify({
      id: "evt_scope",
      object: "event",
      type: "payment_intent.succeeded",
      account: "acct_injected",
      data: { object: { id: "pi_fake" } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_connect",
    });
    const verified = constructStripeWebhookEventWithScope(
      stripe,
      Buffer.from(payload),
      signature,
      [
        { scope: STRIPE_WEBHOOK_SCOPE.PLATFORM, secret: "whsec_platform" },
        { scope: STRIPE_WEBHOOK_SCOPE.CONNECTED, secret: "whsec_connect" },
      ]
    );

    expect(verified.scope).toBe(STRIPE_WEBHOOK_SCOPE.CONNECTED);
    expect(() =>
      assertStripeWebhookScope(verified.event, verified.scope, {
        connectSecretConfigured: true,
      })
    ).toThrow("cannot authorize this event");
  });
});

describe("Stripe Connect production readiness", () => {
  it("preserves platform-only production installations", () => {
    expect(getMissingProductionEnv(productionConfig())).toEqual([]);
  });

  it("requires the Connect signing secret only when Connect is enabled", () => {
    expect(
      getMissingProductionEnv(
        productionConfig({
          connectEnabled: true,
          connectWebhookSecret: "",
        })
      )
    ).toContain("STRIPE_CONNECT_WEBHOOK_SECRET");

    expect(
      getMissingProductionEnv(
        productionConfig({
          connectEnabled: true,
          connectWebhookSecret: "whsec_connect",
        })
      )
    ).not.toContain("STRIPE_CONNECT_WEBHOOK_SECRET");
  });
});

describe("Stripe webhook configuration status", () => {
  it("describes a legacy platform-only setup without claiming verification", () => {
    const status = buildStripeWebhookConfigurationStatus({
      platformSecret: "whsec_platform",
      connectRequired: false,
    });

    expect(status.configured).toBe(true);
    expect(status.connectRequired).toBe(false);
    expect(status.deliveryVerification).toBe("not_performed");
    expect(status).not.toHaveProperty("verified");
  });

  it("marks a missing required Connect secret as incomplete", () => {
    const status = buildStripeWebhookConfigurationStatus({
      platformSecret: "whsec_platform",
      connectRequired: true,
    });

    expect(status.configured).toBe(false);
    expect(status.connectConfigured).toBe(false);
    expect(status.message).toMatch(/Connect is enabled/);
  });

  it("rejects duplicate destination secrets and accepts distinct ones", () => {
    const duplicate = buildStripeWebhookConfigurationStatus({
      platformSecret: "whsec_same",
      connectSecret: "whsec_same",
      connectRequired: true,
    });
    const distinct = buildStripeWebhookConfigurationStatus({
      platformSecret: "whsec_platform",
      connectSecret: "whsec_connect",
      connectRequired: true,
    });

    expect(duplicate.configured).toBe(false);
    expect(duplicate.secretsDistinct).toBe(false);
    expect(distinct.configured).toBe(true);
    expect(distinct.secretsDistinct).toBe(true);
  });
});
