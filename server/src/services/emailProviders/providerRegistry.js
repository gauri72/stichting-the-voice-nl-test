import env from "../../config/env.js";
import { smtpProvider } from "./smtpProvider.js";

const PROVIDERS = {
  smtp: smtpProvider,
};

/** @returns {import("./emailProvider.interface.js").EmailProvider} */
export function getActiveEmailProvider() {
  return PROVIDERS[env.email.provider] || smtpProvider;
}
