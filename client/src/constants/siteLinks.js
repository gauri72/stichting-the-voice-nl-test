/** Public WhatsApp community group (same link as hero CTA). */
export const WHATSAPP_GROUP_URL =
  import.meta.env.VITE_WHATSAPP_GROUP_URL?.trim() ||
  "https://chat.whatsapp.com/Ea3TAolCBlUEgPUzSYdeYs";

/** VOWNL - HerBeats WhatsApp group. */
export const VOWNL_HERBEATS_WHATSAPP_URL =
  "https://chat.whatsapp.com/GitDew5eqOB9ntDVU7XNgg";

/** V.O.I.C.E. Venture Studio WhatsApp group. */
export const VENTURE_STUDIO_WHATSAPP_URL =
  "https://chat.whatsapp.com/FLIGfmUxG0IEVv0xFxf3se";

/** Direct 1:1 WhatsApp chat link (wa.me), used by the various WhatsApp contact buttons. */
export function buildWhatsAppHref() {
  const raw = import.meta.env.VITE_WHATSAPP_E164;
  const digits =
    raw && typeof raw === "string" && raw.replace(/\D/g, "").length >= 8
      ? raw.replace(/\D/g, "")
      : "31619032104";
  return `https://wa.me/${digits}`;
}
