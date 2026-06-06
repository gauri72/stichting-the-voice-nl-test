import QRCode from "qrcode";
import env from "../config/env.js";

/**
 * @param {string} verificationToken
 * @returns {Promise<string>} data:image/png;base64,... URL for email / PDF embedding
 */
export async function generateMembershipQrDataUrl(verificationToken) {
  const verifyUrl = `${env.clientUrl.replace(/\/$/, "")}/membership/verify/${verificationToken}`;
  return QRCode.toDataURL(verifyUrl, {
    width: 300,
    margin: 1,
    errorCorrectionLevel: "M"
  });
}

export function buildMembershipVerifyUrl(verificationToken) {
  return `${env.clientUrl.replace(/\/$/, "")}/membership/verify/${verificationToken}`;
}
