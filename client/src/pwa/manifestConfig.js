export const PWA_VARIANTS = {
  site: "site",
  checkin: "checkin",
};

const CHECK_IN_PATHS = ["/check-in", "/admin/check-in"];

export function getPwaVariantForPath(pathname = "") {
  if (CHECK_IN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return PWA_VARIANTS.checkin;
  }
  return PWA_VARIANTS.site;
}

export function getManifestHref(variant) {
  return variant === PWA_VARIANTS.checkin ? "/manifest-checkin.webmanifest" : "/manifest.webmanifest";
}

export const SITE_PWA_META = {
  themeColor: "#6338c2",
  appleTitle: "V.O.I.C.E. NL",
};

export const CHECKIN_PWA_META = {
  themeColor: "#6338c2",
  appleTitle: "Check-in",
};

export function getPwaMeta(variant) {
  return variant === PWA_VARIANTS.checkin ? CHECKIN_PWA_META : SITE_PWA_META;
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}
