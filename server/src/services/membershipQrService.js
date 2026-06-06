import QRCode from "qrcode";
import env from "../config/env.js";

/**
 * Scan target encoded inside the QR. Resolves to a human-friendly verification
 * page served by this API (content-negotiated HTML for browsers / scanners).
 * @param {string} verificationToken
 */
export function buildMembershipVerifyUrl(verificationToken) {
  return `${env.publicApiUrl}/api/membership/verify/${verificationToken}`;
}

/**
 * Hosted PNG URL for the QR image. Email clients (Gmail, Outlook) block inline
 * data: URIs, so emails/receipts must reference a real HTTP image instead.
 * @param {string} verificationToken
 */
export function buildMembershipQrImageUrl(verificationToken) {
  return `${env.publicApiUrl}/api/membership/qr/${verificationToken}.png`;
}

const QR_OPTIONS = {
  width: 300,
  margin: 1,
  errorCorrectionLevel: "M"
};

/**
 * @param {string} verificationToken
 * @returns {Promise<string>} data:image/png;base64,... (used for the PDF receipt embed)
 */
export async function generateMembershipQrDataUrl(verificationToken) {
  return QRCode.toDataURL(buildMembershipVerifyUrl(verificationToken), QR_OPTIONS);
}

/**
 * @param {string} verificationToken
 * @returns {Promise<Buffer>} PNG buffer (served by the QR endpoint / embedded in PDF)
 */
export async function generateMembershipQrPngBuffer(verificationToken) {
  return QRCode.toBuffer(buildMembershipVerifyUrl(verificationToken), {
    ...QR_OPTIONS,
    type: "png"
  });
}
