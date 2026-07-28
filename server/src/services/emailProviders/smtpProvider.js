import { sendBroadcastEmail } from "../broadcastMailer.js";

/** @type {import("./emailProvider.interface.js").EmailProvider} */
export const smtpProvider = {
  name: "smtp",
  capabilities: { webhooks: false, bounceTracking: false },

  async send({ to, subject, html }) {
    const info = await sendBroadcastEmail({ to, subject, html });
    return { providerMessageId: info?.messageId || "", status: "sent" };
  },

  // Plain SMTP relay has no webhook mechanism to verify — always false, so any accidental
  // webhook route hit while running this provider is rejected rather than trusted.
  verifyWebhookSignature() {
    return false;
  },

  parseWebhookEvent() {
    return null;
  },
};
