export {
  buildTicketQrPath,
  buildTicketVerifyUrl,
  buildTicketQrImageUrl,
  generateTicketQrPngBuffer,
  generateTicketQrSvgString,
} from "../ticketQrService.js";
export { buildMembershipQrImageUrl } from "../membershipQrService.js";

import { buildTicketQrPath, generateTicketQrPngBuffer } from "../ticketQrService.js";
import { buildMembershipQrImageUrl } from "../membershipQrService.js";

export async function generateQrForBooking({ kind = "ticket", token, ticketNumber }) {
  const ref = token || ticketNumber;
  if (kind === "membership") {
    return { url: buildMembershipQrImageUrl(token), kind };
  }
  const path = buildTicketQrPath(ref);
  const png = await generateTicketQrPngBuffer(ref).catch(() => null);
  return { path, png, kind: "ticket" };
}
