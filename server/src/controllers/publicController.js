import env from "../config/env.js";
import { isMailerConfigured } from "../services/smtpTransport.js";

export function getPublicSiteConfig(_req, res) {
  res.status(200).json({
    contactEmail: env.org.contactEmail,
    mailConfigured: isMailerConfigured()
  });
}
