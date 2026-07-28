/**
 * The contract every email provider implementation must satisfy. Deliberately thin — four
 * methods, no queueing/retry/event-mapping abstraction — since only one implementation
 * (smtpProvider.js) exists today and nothing yet consumes webhook events. This exists so
 * that plugging in a future webhook-capable ESP is a matter of adding one new file that
 * satisfies this shape and switching EMAIL_PROVIDER, not rewriting the broadcast send flow
 * or the report page.
 *
 * @typedef {Object} EmailProviderCapabilities
 * @property {boolean} webhooks - true if this provider can push delivery/bounce/open/click
 *   events to us; false for plain SMTP relays that only confirm the send was accepted.
 * @property {boolean} bounceTracking - true if Delivered/Bounced can ever become real,
 *   non-fabricated numbers with this provider. The report page shows "Not enough data" for
 *   those tiles whenever this is false, rather than inventing a number.
 *
 * @typedef {Object} EmailProvider
 * @property {string} name
 * @property {EmailProviderCapabilities} capabilities
 * @property {(args: {to: string, subject: string, html: string}) => Promise<{providerMessageId: string, status: string}>} send
 * @property {(req: import("express").Request) => boolean} verifyWebhookSignature
 * @property {(payload: unknown) => {providerEventId: string, eventType: string, providerMessageId: string, occurredAt: Date} | null} parseWebhookEvent
 */

export {};
