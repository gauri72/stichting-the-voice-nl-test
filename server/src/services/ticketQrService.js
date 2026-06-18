import env from "../config/env.js";
import QRCode from "qrcode";

const QR_OPTIONS = {
  width: 300,
  margin: 1,
  errorCorrectionLevel: "M",
};

export function buildTicketVerifyUrl(verificationToken) {
  return `${env.publicApiUrl}/api/tickets/verify/${verificationToken}`;
}

export function buildTicketQrImageUrl(verificationToken) {
  return `${env.publicApiUrl}/api/tickets/qr/${verificationToken}.png`;
}

export async function generateTicketQrDataUrl(verificationToken) {
  return QRCode.toDataURL(buildTicketVerifyUrl(verificationToken), QR_OPTIONS);
}

export async function generateTicketQrPngBuffer(verificationToken) {
  return QRCode.toBuffer(buildTicketVerifyUrl(verificationToken), {
    ...QR_OPTIONS,
    type: "png",
  });
}
